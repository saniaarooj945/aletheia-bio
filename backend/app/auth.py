import hashlib
import hmac
import os
import re
import secrets
import sqlite3
import time
from contextlib import contextmanager
from pathlib import Path


DATABASE_PATH = Path(
    os.getenv(
        "ALETHEIA_AUTH_DB_PATH",
        str(Path(__file__).with_name("aletheia_auth.sqlite3")),
    )
)
PASSWORD_ITERATIONS = 310_000
SESSION_SECONDS = 60 * 60 * 12
REMEMBERED_SESSION_SECONDS = 60 * 60 * 24 * 30
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class DuplicateEmailError(ValueError):
    pass


@contextmanager
def _connect():
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def initialize_auth_store():
    with _connect() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                email TEXT PRIMARY KEY,
                display_name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                created_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS auth_sessions (
                token_hash TEXT PRIMARY KEY,
                email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
                expires_at INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_auth_sessions_expiration
                ON auth_sessions(expires_at);
            """
        )


def normalize_email(email: str) -> str:
    normalized = email.strip().casefold()
    if len(normalized) > 254 or not EMAIL_PATTERN.fullmatch(normalized):
        raise ValueError("Enter a valid email address.")
    return normalized


def validate_password(password: str):
    if len(password) < 12:
        raise ValueError("Password must contain at least 12 characters.")
    if len(password) > 128:
        raise ValueError("Password must not exceed 128 characters.")


def _password_hash(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, PASSWORD_ITERATIONS
    )
    return f"pbkdf2_sha256${PASSWORD_ITERATIONS}${salt.hex()}${digest.hex()}"


def _verify_password(password: str, encoded_hash: str) -> bool:
    try:
        algorithm, rounds, salt_hex, digest_hex = encoded_hash.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        expected = bytes.fromhex(digest_hex)
        actual = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            bytes.fromhex(salt_hex),
            int(rounds),
        )
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(actual, expected)


DUMMY_PASSWORD_HASH = _password_hash("invalid-account-password")


def _user_payload(row):
    return {"email": row["email"], "display_name": row["display_name"]}


def _issue_session(connection, email: str, remember_me: bool):
    token = secrets.token_urlsafe(32)
    expires_at = int(time.time()) + (
        REMEMBERED_SESSION_SECONDS if remember_me else SESSION_SECONDS
    )
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    connection.execute(
        "INSERT INTO auth_sessions (token_hash, email, expires_at) VALUES (?, ?, ?)",
        (token_hash, email, expires_at),
    )
    return token


def create_account(email: str, password: str, display_name: str, remember_me: bool):
    normalized_email = normalize_email(email)
    validate_password(password)
    normalized_name = display_name.strip()
    if not 2 <= len(normalized_name) <= 80:
        raise ValueError("Name must contain between 2 and 80 characters.")

    try:
        with _connect() as connection:
            connection.execute(
                "INSERT INTO users (email, display_name, password_hash, created_at) "
                "VALUES (?, ?, ?, ?)",
                (
                    normalized_email,
                    normalized_name,
                    _password_hash(password),
                    int(time.time()),
                ),
            )
            token = _issue_session(connection, normalized_email, remember_me)
            row = connection.execute(
                "SELECT email, display_name FROM users WHERE email = ?",
                (normalized_email,),
            ).fetchone()
    except sqlite3.IntegrityError as error:
        raise DuplicateEmailError(
            "An account with this email already exists."
        ) from error

    return _user_payload(row), token


def authenticate(email: str, password: str, remember_me: bool):
    normalized_email = normalize_email(email)
    with _connect() as connection:
        row = connection.execute(
            "SELECT email, display_name, password_hash FROM users WHERE email = ?",
            (normalized_email,),
        ).fetchone()

        if row is None:
            _verify_password(password, DUMMY_PASSWORD_HASH)
            return None

        if not _verify_password(password, row["password_hash"]):
            return None

        token = _issue_session(connection, normalized_email, remember_me)
        return _user_payload(row), token


def user_for_token(token: str):
    if not token:
        return None
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    now = int(time.time())
    with _connect() as connection:
        row = connection.execute(
            """
            SELECT users.email, users.display_name, auth_sessions.expires_at
            FROM auth_sessions
            JOIN users ON users.email = auth_sessions.email
            WHERE auth_sessions.token_hash = ?
            """,
            (token_hash,),
        ).fetchone()
        if row is None:
            return None
        if row["expires_at"] <= now:
            connection.execute(
                "DELETE FROM auth_sessions WHERE token_hash = ?", (token_hash,)
            )
            return None
        return _user_payload(row)


def revoke_session(token: str):
    if not token:
        return
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    with _connect() as connection:
        connection.execute(
            "DELETE FROM auth_sessions WHERE token_hash = ?", (token_hash,)
        )


def update_display_name(email: str, display_name: str):
    normalized_name = display_name.strip()
    if not 2 <= len(normalized_name) <= 80:
        raise ValueError("Name must contain between 2 and 80 characters.")
    with _connect() as connection:
        connection.execute(
            "UPDATE users SET display_name = ? WHERE email = ?",
            (normalized_name, email),
        )
        row = connection.execute(
            "SELECT email, display_name FROM users WHERE email = ?", (email,)
        ).fetchone()
    if row is None:
        return None
    return _user_payload(row)
