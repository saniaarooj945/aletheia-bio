import os
import tempfile
import unittest
import uuid
from pathlib import Path


_test_database_dir = tempfile.TemporaryDirectory()
os.environ["ALETHEIA_AUTH_DB_PATH"] = str(
    Path(_test_database_dir.name) / "auth-tests.sqlite3"
)

from fastapi.testclient import TestClient

from app.main import app


class AuthenticationApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.email = f"user-{uuid.uuid4().hex}@example.com"
        self.password = "correct horse battery staple"
        self.display_name = "Research User"

    def register(self, email=None, password=None):
        return self.client.post(
            "/api/auth/register",
            json={
                "display_name": self.display_name,
                "email": email or self.email,
                "password": password or self.password,
                "remember_me": False,
            },
        )

    def test_registration_creates_a_protected_session(self):
        response = self.register()
        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertEqual(payload["user"]["email"], self.email)

        authorized = self.client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {payload['access_token']}"},
        )
        self.assertEqual(authorized.status_code, 200)
        self.assertEqual(authorized.json()["display_name"], self.display_name)

    def test_duplicate_email_is_rejected_case_insensitively(self):
        self.assertEqual(self.register().status_code, 201)
        duplicate = self.register(email=self.email.upper())
        self.assertEqual(duplicate.status_code, 409)

    def test_invalid_credentials_do_not_create_a_session(self):
        self.assertEqual(self.register().status_code, 201)
        invalid = self.client.post(
            "/api/auth/login",
            json={"email": self.email, "password": "not the right password"},
        )
        self.assertEqual(invalid.status_code, 401)

        valid = self.client.post(
            "/api/auth/login",
            json={"email": self.email, "password": self.password},
        )
        self.assertEqual(valid.status_code, 200)

    def test_missing_and_revoked_sessions_cannot_access_protected_routes(self):
        self.assertEqual(self.client.get("/api/auth/me").status_code, 401)
        response = self.register()
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        self.assertEqual(self.client.post("/api/auth/logout", headers=headers).status_code, 200)
        self.assertEqual(self.client.get("/api/auth/me", headers=headers).status_code, 401)

    def test_registration_validates_email_and_password(self):
        invalid_email = self.register(email="not-an-email")
        self.assertEqual(invalid_email.status_code, 400)

        weak_password = self.register(password="short")
        self.assertEqual(weak_password.status_code, 400)


if __name__ == "__main__":
    unittest.main()
