package used -

FastAPI — Build REST APIs with Python.
Uvicorn — ASGI server used to run the FastAPI application.
SQLAlchemy — ORM for working with relational databases.
Alembic — Database migration management for SQLAlchemy.
psycopg2-binary — PostgreSQL driver for Python.
Pydantic Settings — Manage environment variables and application configuration.
Redis — Python client for Redis, useful for caching, sessions, queues, and rate limiting.
python-jose[cryptography] - Use this for creating and verifying JWT access/refresh tokens.
passlib[bcrypt] - Password hashing and test
python-multipart Lets FastAPI read multipart/form-data, which is how files and form fields arrive together. Without it, Form(...) and File(...) endpoints raise a runtime error at startup.
boto3 The AWS/S3 client. It talks to Cloudflare R2 because R2 is S3-compatible.
pillow Checks that the uploaded file is really an image (not a renamed .exe or script).
