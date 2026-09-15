# HealthBridge Backend

This is the FastAPI backend for HealthBridge. It exposes the healthcare platform APIs and connects to PostgreSQL and Redis for persistence and caching.

## Tech stack

- Python 3.14+
- FastAPI
- SQLAlchemy
- PostgreSQL
- Redis
- JWT authentication
- Alembic migrations

## Local setup

1. Open a terminal in the backend folder:
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   python -m pip install --upgrade pip
   pip install -e .
   ```
4. Create a local environment file named `.env.dev` in the backend folder with the required values:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/healthbridge
   REDIS_URL=redis://localhost:6379/0
   JWT_SECRET=change_this_secret
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   REFRESH_TOKEN_EXPIRE_DAYS=7
   ```
5. Start the API:
   ```bash
   uvicorn main:app --reload
   ```

The API health check is available at:

```bash
http://localhost:8000/api/v1/health
```

## Project structure

- `app/` — application code, models, dependencies, and configuration
- `alembic/` — database migration scripts
- `main.py` — FastAPI app entry point
