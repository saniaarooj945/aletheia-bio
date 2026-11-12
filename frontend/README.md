# Aletheia Bio — Glass Box Multi-Omics Engine & Dashboard

An enterprise-grade, glass-box multi-omics research engine and dashboard designed to streamline bioinformatics workflows, unify backend analytical pipelines, and deliver intuitive frontend data visualizations.

---

## 🚀 Tech Stack

* **Backend**: Python, FastAPI (`CORSMiddleware`), Uvicorn, LangGraph, RDKit, Custom Bioinformatics Tools.
* **Frontend**: React, Vite, Axios, React Router, responsive enterprise UI.
* **Architecture**: Decoupled REST API backend with a fixed, responsive navigation shell and separate module routes.

---

## 📁 Directory Structure

```text
aletheia-bio/
│
├── backend/                  # FastAPI Backend & Analytics Engine
│   ├── app/                  # Application core modules
│   │   └── auth.py           # SQLite-backed account and session storage
│   ├── tests/                # Backend authentication tests
│   ├── venv/                 # Python Virtual Environment (Ignored in Git)
│   ├── main.py               # FastAPI Entrypoint & CORS Config
│   └── test_tools.py         # Backend validation scripts
│
├── frontend/                 # React + Vite Enterprise Dashboard
│   ├── src/                  # Components, assets, and styling (App.css, App.jsx)
│   ├── public/               # Static assets & icons
│   ├── node_modules/         # Dependencies (Ignored in Git)
│   ├── package.json          # Frontend dependencies & scripts
│   └── vite.config.js        # Vite bundler configuration
│
├── .gitignore                # Global ignore rules for venv & node_modules
└── README.md                 # Project Documentation
```

## Run locally

Start the backend from the repository root:

```powershell
Set-Location .\backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

In another terminal, start the frontend:

```powershell
Set-Location .\frontend
npm install
npm run dev
```

The frontend uses `http://127.0.0.1:8000` as its default API URL. Set
`VITE_API_BASE_URL` when the backend runs elsewhere. Set
`ALETHEIA_CORS_ORIGINS` to a comma-separated list of allowed frontend origins
when deploying outside the included localhost development ports.

## Accounts and sessions

Create the first account using **Create an account** on the sign-in page.
Registration requires a valid email address, a display name, and a password
between 12 and 128 characters. Email addresses are case-insensitive and unique;
sign-in rejects unknown accounts and incorrect passwords. Passwords are stored
as salted PBKDF2-HMAC-SHA256 hashes, and protected analysis endpoints require a
valid bearer session. Sessions last 12 hours by default or 30 days when
**Remember me** is selected.

The SQLite account database is created at
`backend/app/aletheia_auth.sqlite3` by default. Override its location with
`ALETHEIA_AUTH_DB_PATH`; the database file is git-ignored. Use HTTPS and
configure the allowed origins and database location for production. Google
OAuth and email-based password reset require provider configuration and are
intentionally not presented as working actions until configured.