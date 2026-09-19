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

## How a request flows

Every endpoint moves through the same four layers. Each layer has one job, and
nothing skips a layer:

```
HTTP request
   |
   v
router      app/routers/userRouter.py       validates the body against a schema,
   |                                        builds the service via Depends()
   v
controller  app/controllers/userController.py  translates domain errors into
   |                                           HTTP status codes
   v
service     app/services/userService.py      the business rules
   |
   v
repository  app/repositories/userRepositories.py  the only place that touches
                                                  the database session
```

Supporting pieces the service layer reaches for directly:

| Module | Role |
| --- | --- |
| `app/core/security.py` | bcrypt hashing, JWT encode/decode |
| `app/core/redis.py` | shared Redis client (OTP codes, pending registrations, user cache) |
| `app/core/config.py` | settings loaded from `.env.dev` |
| `app/utils/otp/` | OTP generation, verification, and email delivery |
| `app/utils/integration/medplum/` | creates the FHIR `Patient` resource |
| `app/deps/auth.py` | `get_current_user` — the dependency that guards protected routes |

### Registration (two steps, the user is only created at step 2)

`POST /api/v1/users/register/request-otp`

1. Reject the request if the email or phone number already exists.
2. Generate a TOTP code and store its secret in Redis under `OTP : <email>`,
   with `OTP_EXPIRY_SECONDS` as the TTL.
3. Store the **pending** registration in Redis under
   `registration:pending:<email>` — the profile fields plus a bcrypt
   `password_hash`. The raw password is never stored.
4. Email the code. If the email fails to send, both Redis keys are deleted so a
   code that was never delivered cannot be used.
5. Respond `202 Accepted`. No database row exists yet.

`POST /api/v1/users/register/verify`

1. Verify the OTP. Wrong codes increment `OTP Attempt : <email>`; after
   `OTP_MAX_ATTEMPTS` the secret is deleted and the user must start over.
2. Read the pending payload back from Redis (expired → `400`, start over).
3. Insert the `users` row with the stored hash and `is_active=True` — the OTP
   just proved the address, so the account can log in immediately.
4. Create the Medplum FHIR `Patient` and save `medplum_patient_id` on the row.
5. Cache the user at `user:<id>` and delete the pending key.
6. Respond `201 Created` with the user.

### Login

`POST /api/v1/users/login` — body `{"email": ..., "password": ...}`

1. Look up the user by email (lower-cased before the lookup).
2. Compare the password with `bcrypt.checkpw` against `hashed_password`.
   A missing user and a wrong password return the **same** `401`, so the
   response cannot be used to discover which emails are registered.
3. Reject an unverified account with `403`.
4. Sign a JWT whose `sub` is the **user id** (not the email — `get_current_user`
   looks the user up by id), with `type: "access"` and an `exp` of
   `ACCESS_TOKEN_EXPIRE_MINUTES` minutes.
5. Respond `200` with `{"access_token": ..., "token_type": "bearer"}`.

| Outcome | Status |
| --- | --- |
| Success | `200` |
| Unknown email or wrong password | `401` |
| Account not verified | `403` |

### Using the token

Send it as `Authorization: Bearer <access_token>`. Any route that declares
`Depends(get_current_user)` will decode it, require `type == "access"`, load the
user by `sub`, and reject the request with `401` unless that user exists and is
active.

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/users/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"your-password"}' | jq -r .access_token)

# then use $TOKEN on any route guarded by get_current_user
```
