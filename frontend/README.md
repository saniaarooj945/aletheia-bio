# Aletheia Bio — Glass Box Multi-Omics Engine & Dashboard

An enterprise-grade, glass-box multi-omics research engine and dashboard designed to streamline bioinformatics workflows, unify backend analytical pipelines, and deliver intuitive frontend data visualizations.

---

## 🚀 Tech Stack

* **Backend**: Python, FastAPI (`CORSMiddleware`), Uvicorn, LangGraph, RDKit, Custom Bioinformatics Tools.
* **Frontend**: React, Vite, Axios, Custom Dark Enterprise CSS Theme, Lucide Icons.
* **Architecture**: Decoupled REST API backend with a responsive single-column flexible frontend layout.

---

## 📁 Directory Structure

```text
aletheia-bio/
│
├── backend/                  # FastAPI Backend & Analytics Engine
│   ├── app/                  # Application core modules
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