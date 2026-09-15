# SYMPTORA

SYMPTORA is a healthcare-focused project with a FastAPI backend and a React frontend.

## Project structure

- `backend/` — API server, database models, authentication, and environment configuration
- `client/` — Vite + React frontend application

## Quick start

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -e .
```

Create a `.env.dev` file in the backend folder before running the app. See [backend/README.md](backend/README.md) for the required environment variables and startup commands.

### Frontend

```bash
cd client
npm install
npm run dev
```

## Notes

- Python environment files and local secrets are ignored by the repository rules.
- If you add new backend dependencies, update the project configuration in [backend/pyproject.toml](backend/pyproject.toml).
