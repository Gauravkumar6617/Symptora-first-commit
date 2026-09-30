# Symptora

**Know when it matters. Act before it's late.**

Symptora helps people decide how urgently they need care. You describe your
symptoms, get a risk level (Low / Medium / High) with the likely conditions,
and go straight to the right next step: self-care tips, a clinic appointment,
or an instant paid video consultation with the next available doctor. A
High-risk result opens that consultation for you automatically. One account
covers your whole family, and every record is synced to a Medplum FHIR
backend.

| Part | Folder | Stack |
| --- | --- | --- |
| API server | [`backend/`](backend/) | FastAPI · SQLAlchemy · PostgreSQL · Redis · Alembic · scikit-learn |
| Web app | [`client/`](client/) | React 19 · Vite · TypeScript · Tailwind · TanStack Query · Zustand |
| Mobile app | [`frontend-app/`](frontend-app/) | Expo (React Native) · Expo Router · TypeScript |

**Full documentation:** [docs/GUIDE.md](docs/GUIDE.md) covers setup, every
environment variable, feature walkthroughs, the API reference, Medplum sync,
testing, deployment and troubleshooting.

## Features

- **Symptom checker.** Type in plain words ("vomiting for two days and there's
  blood") or pick symptoms from a list. The server matches them to known
  symptoms, flags red-flag phrases, predicts the top 3 conditions with a
  locally trained model, and sets an urgency level.
- **Instant telemedicine.** The patient pays the consultation fee (Razorpay
  test mode, or a simulated gateway in dev). Every online doctor then gets the
  request live, and the first to accept takes it. The call is a WebRTC video
  call in the browser.
- **Notifications.** A bell in the header shows when the doctor or patient has
  joined the call, a doctor has accepted, a new message or prescription has
  arrived, or a payment has gone through. Emails go out for the key events.
- **Chat and e-prescriptions.** Each appointment or consultation has a
  message thread. Doctors issue prescriptions, and patients download them as
  a PDF.
- **Appointments.** Book a doctor, or a service at a partner clinic, in
  morning or afternoon slots. Google Calendar events include a Meet link.
- **Family profiles.** Run checks, book visits and hold consultations on
  behalf of family members. You can invite them to activate their own account.
- **Doctors and admin.** Anyone can apply to become a doctor, and an admin
  approves them. The admin dashboard manages clinics, services, doctors and
  blog posts.
- **Medplum FHIR sync.** Patients, practitioners, clinics, symptom checks,
  consultations, messages and prescriptions are written to Medplum as FHIR
  resources. This runs in the background, so if Medplum is down the app keeps
  working.

## Quick start

You need Python 3.14+ with [uv](https://docs.astral.sh/uv/), Node 20+ with
pnpm, PostgreSQL and Redis.

```bash
# 1. API: http://localhost:8000 (interactive docs at /docs)
cd backend
uv sync
cp .env.example .env.dev        # fill in; see docs/GUIDE.md "Environment variables"
uv run alembic upgrade head
uv run python -m scripts.seed_demo_data   # optional demo clinics, doctors, patients
uv run uvicorn main:app --reload

# 2. Web app: http://localhost:5173
cd client
echo "VITE_API_URL=http://localhost:8000" > .env
pnpm install && pnpm dev

# 3. Mobile app (optional)
cd frontend-app
echo "EXPO_PUBLIC_API_URL=http://<your-LAN-IP>:8000" > .env
npm install && npx expo start
```

### Demo accounts (after seeding)

All use the password **`Demo@12345`**.

| Role | Email |
| --- | --- |
| Patient | `ananya.patel@symptora.demo`, `rahul.verma@symptora.demo` |
| Doctor | `neha.sharma@symptora.demo` (General Physician), `asha.rao@…` (Cardiology), `rohan.mehta@…` (Dermatology), `kabir.singh@…` (Pediatrics), `priya.nair@…`, `arjun.reddy@…`, `meera.iyer@…`, `vikram.das@…` |

To try telemedicine end to end, log in as a doctor in one browser and keep the
**Doctor dashboard** open. In another browser (or a private window), log in as
a patient, start a video consult, and pay. The simulated gateway is used when
no Razorpay keys are set. The doctor sees the request and accepts it, and both
sides land in the call.

## Tests

```bash
cd backend && uv run pytest -q      # API, telemedicine, payment, parser and model tests
cd client && pnpm build             # type-check + production build
```

## Repository layout

```
backend/        FastAPI app (routers → controllers → services → repositories), Alembic, ML model, tests
  ml/           training script + saved model (ml/artifact/)
  data/         symptom/disease datasets (raw + processed)
  scripts/      seed_demo_data.py
client/         React web app (pages/, components/, lib/api.ts)
frontend-app/   Expo mobile app (src/app/ file-based routes)
docs/GUIDE.md   the comprehensive guide
```

> Symptora gives guidance, not a diagnosis. In an emergency, call your local
> emergency number (112 in India).
