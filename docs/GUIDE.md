# Symptora: Comprehensive Guide

This guide is for developers, reviewers and operators. Start with the
[README](../README.md) for a one-page overview.

1. [What Symptora does](#1-what-symptora-does)
2. [Architecture](#2-architecture)
3. [Local setup](#3-local-setup)
4. [Environment variables](#4-environment-variables)
5. [Roles and accounts](#5-roles-and-accounts)
6. [Feature walkthroughs](#6-feature-walkthroughs)
7. [Medplum FHIR integration](#7-medplum-fhir-integration)
8. [API reference](#8-api-reference)
9. [The symptom model](#9-the-symptom-model)
10. [Testing](#10-testing)
11. [Deployment](#11-deployment)
12. [Troubleshooting](#12-troubleshooting)
13. [Known limits and next steps](#13-known-limits-and-next-steps)

---

## 1. What Symptora does

Symptora gets people from *"I don't feel well"* to the right kind of care:

1. **Health check.** Describe your symptoms and get a Low, Medium or High
   risk level, the three most likely conditions, and the precautions for each.
2. **Right next step.**
   - Low or Medium: self-care tips, or book a clinic appointment.
   - High: an instant video consultation opens automatically. The patient
     pays the fee, and every online doctor is alerted.
   - Emergency phrases (chest pain, trouble breathing, stroke signs, blood
     with vomiting): an alert to call 112 now.
3. **Follow-up.** Chat with the doctor, receive an e-prescription and
   download it as a PDF. Everything is kept in your history and in Medplum.
4. **Family.** Do all of the above for parents and children from one
   account.

---

## 2. Architecture

```
 ┌──────────────┐    REST + WebSocket     ┌──────────────────────────┐
 │ Web (client) │ ──────────────────────▶ │ FastAPI (backend)        │
 │ React + Vite │ ◀── WebRTC signaling ── │  routers → controllers   │
 └──────┬───────┘                         │  → services → repos      │
        │ in-app browser handoff          └──┬─────┬──────┬──────┬───┘
 ┌──────┴───────┐     REST + WebSocket       │     │      │      │
 │ Mobile (Expo)│ ──────────────────────────▶│     │      │      │
 └──────────────┘                     PostgreSQL Redis  Medplum  Razorpay / Brevo /
                                      (data)   (OTP,    (FHIR)   Google Calendar / R2
                                               cache)
```

**Request flow.** Every endpoint goes through the same four layers. The router
validates input, the controller maps errors to HTTP status codes, the service
holds the business rules, and the repository is the only layer that touches
the database. See [backend/README.md](../backend/README.md) for the
registration and login flows in detail.

**Real time.**

| Channel | Who connects | Purpose |
| --- | --- | --- |
| `WS /ws/telemedicine/doctor` | approved doctors on the dashboard | new paid requests, removed requests |
| `WS /ws/telemedicine/patient/{id}` | the waiting patient | "accepted" / "cancelled" |
| `WS /ws/call/...` | the two call participants | WebRTC offer/answer/ICE relay (media is peer-to-peer) |
| `GET /notifications` (polled every 10 s) | any signed-in user | bell notifications |

All three sockets have a REST polling fallback, so a dropped connection never
leaves anyone stuck.

**Video calls.** The call page is WebRTC in the browser. The mobile app opens
the web call page in an in-app browser (`EXPO_PUBLIC_WEB_URL`) instead of
bundling a native WebRTC stack.

---

## 3. Local setup

### Prerequisites

- Python **3.14+** and [uv](https://docs.astral.sh/uv/)
- Node **20+**, with **pnpm** for the web app and npm for the mobile app
- PostgreSQL 15+ and Redis 7+. Local installs, Docker, or hosted services
  (Neon, Upstash) all work.
- A free [Medplum](https://app.medplum.com) project with a client application
  (client credentials)

### Backend

```bash
cd backend
uv sync                                   # installs from uv.lock into .venv
cp .env.example .env.dev                  # then fill it in (section 4)
uv run alembic upgrade head               # creates / migrates all tables
uv run python -m scripts.seed_demo_data   # optional demo data (safe to re-run)
uv run uvicorn main:app --reload          # http://localhost:8000
```

- Health check: `GET http://localhost:8000/api/v1/health`
- Interactive API docs: `http://localhost:8000/docs`

The seed script calls the real app services. It creates real Medplum
Organization and Practitioner records for the clinics and doctors, and adds
two demo patients, each with a finished, paid consultation (chat, prescription,
notifications).

### Web app

```bash
cd client
echo "VITE_API_URL=http://localhost:8000" > .env
pnpm install
pnpm dev                                  # http://localhost:5173
```

### Mobile app

```bash
cd frontend-app
cat > .env <<'EOF'
EXPO_PUBLIC_API_URL=http://192.168.1.5:8000       # your machine's LAN IP, not localhost
EXPO_PUBLIC_WEB_URL=https://symptora-ten.vercel.app   # where video calls open
EOF
npm install
npx expo start
```

If the phone isn't on the same Wi-Fi as your machine, expose the API through a
tunnel (`cloudflared tunnel --url http://localhost:8000`) and use that URL.

---

## 4. Environment variables

### Backend (`backend/.env.dev`)

A template with every variable is in
[`backend/.env.example`](../backend/.env.example).

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | yes | | PostgreSQL URL |
| `REDIS_URL` | yes | | Redis URL: OTP codes, pending sign-ups, user cache |
| `JWT_SECRET` | yes | | signs access tokens |
| `JWT_ALGORITHM` | | `HS256` | |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | | `30` | session length (there is no refresh flow; the user logs in again) |
| `MEDPLUM_BASE_URL`, `MEDPLUM_CLIENT_ID`, `MEDPLUM_CLIENT_SECRET`, `MEDPLUM_PROJECT_ID` | yes | | FHIR sync (section 7) |
| `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | yes | | Cloudflare R2 for avatars and clinic/blog images |
| `R2_PRESIGNED_EXPIRY_SECONDS` | | `3600` | how long image links stay valid |
| `MAX_AVATAR_SIZE_MB` | | `5` | |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` | yes | | Google Calendar events and Meet links for appointments |
| `BREVO_API_KEY` | | | email over HTTPS. Used instead of SMTP when set (Render's free tier blocks SMTP). |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_USE_TLS`, `FROM_EMAIL` | | Gmail defaults | SMTP email fallback |
| `INVITE_FROM_EMAIL`, `INVITE_PROMO_URL` | | | family-invite sender and footer link |
| `FRONTEND_URL` | | `http://localhost:5173` | base for links inside emails |
| `OTP_EXPIRY_SECONDS`, `OTP_COOLDOWN_SECONDS`, `OTP_MAX_ATTEMPTS` | | `300`, `30`, `5` | |
| `TELEMEDICINE_FEE` | | `499` | instant consultation fee, in rupees |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | | *(empty)* | Razorpay **test** keys (`rzp_test_…`). If either is empty, the **simulated gateway** is used (dev only). |
| `CORS_ORIGINS` | | | extra allowed origins, comma-separated. Localhost, LAN IPs and `symptora*.vercel.app` are already allowed. |
| `RENDER_EXTERNAL_URL`, `KEEP_ALIVE_INTERVAL_SECONDS` | | | self-ping so Render's free tier doesn't sleep |

### Web (`client/.env`)

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | API base URL, e.g. `http://localhost:8000`. Leave it unset if the API is served from the same origin. |
| `VITE_TURN_URL`, `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL` | optional TURN relay for video calls (comma-separate several URLs). Phones on mobile data usually need one, because STUN alone can't get through carrier NAT. |

### Mobile (`frontend-app/.env`)

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | API base URL that the phone or emulator can reach |
| `EXPO_PUBLIC_WEB_URL` | the deployed web app, where video calls open |

---

## 5. Roles and accounts

| Role | How you get it | Can do |
| --- | --- | --- |
| **Patient** | Sign up (email OTP) | health checks, appointments, telemedicine, chat, prescriptions, family |
| **Doctor** | Sign up, then **Apply as a doctor** (specialization + license), then an admin approves | doctor dashboard: live consult queue, appointments, chat, prescribe, availability, fee |
| **Admin** | Set `users.is_admin = true` in the database (`UPDATE users SET is_admin = true WHERE email = '…';`) | approve/reject doctors, manage clinics, services and blog, view stats |
| **Family member** | Added by an account owner. Can be invited by email to activate their own login. | sees the checks that were run about them |

A doctor can't start an instant consultation for themselves, and an admin
can't either. Those endpoints are for patients only.

Demo logins after seeding are listed in the [README](../README.md#demo-accounts-after-seeding).
They all use the password `Demo@12345`.

---

## 6. Feature walkthroughs

### 6.1 Symptom checker (health check)

**Web:** `/symptom-checker`. **API:** `POST /symptoms/parse`, then `POST /predict`.

1. The patient types in free text or picks symptoms, and optionally adds age,
   gender, duration and who the check is for.
2. `/symptoms/parse` turns the text into known symptom IDs. It handles
   synonyms ("throwing up" becomes vomiting), typos, negation ("no fever"),
   durations ("for two days") and linking words. Vague words become
   *did-you-mean* choices ("blood" could mean stool, vomit, sputum or urine).
   Red-flag phrases produce warnings straight away.
3. `/predict` returns the three most likely conditions with descriptions and
   precautions, an urgency level with reasons, and an `emergency` flag.
   - Urgency starts from severity weights (1–7). It goes up one level for
     children under 2, adults 65 and over, or symptoms lasting more than a
     week.
   - Emergency symptoms or red-flag text force urgency to **high**.
4. The check is saved to the history, which is shared with family, and
   synced to Medplum.
5. A **high** result automatically opens a priority telemedicine
   consultation. The patient pays, and the request goes to the top of every
   doctor's queue.

All text parsing and prediction run on the server. No health text is sent to
any third party.

### 6.2 Instant telemedicine: from request to call

```
Patient                               Server                               Doctor (dashboard open)
───────                               ──────                               ───────────────────────
Start consult / High-risk check ─▶  consultation: PENDING, unpaid
Waiting page → "Pay ₹499"       ─▶  POST …/payment/order  (Razorpay order or simulated)
Razorpay checkout / simulated   ─▶  POST …/payment/confirm (HMAC verified)  → paid_at set
                                     ├─ bell: "Payment received"
                                     ├─ WS push "new-consultation" ──────────────▶ request appears
                                     └─ email to approved doctors                  (+10 s poll fallback)
                                                                     ◀──────────── Accept (first wins)
                                     status IN_PROGRESS, Encounter → Medplum
"accepted" push + bell + email  ◀──  bell: "Dr. X accepted — join now"
Call page ◀──────────── WebRTC signaling via /ws/call/telemedicine/{id} ─────────▶ Call page
                                     bell: "Dr. X joined the video call" (to whoever isn't in yet)
Both hang up (room empties)     ─▶  COMPLETED automatically, Medplum Encounter → finished
```

- **Unpaid requests never reach doctors.** `list_pending` and `claim` both
  require `paid_at`.
- **First doctor wins.** An atomic update means two doctors can't both
  accept the same request.
- **Ending:** the consultation completes by itself once *both* people have
  left a call they were both in. After that, "Rejoin" disappears and the
  call link says the consultation has ended. If only one side drops (a closed
  tab, a network blip), the other is still in the room, so the one who
  dropped can rejoin.
- **Cancel:** the patient can cancel while it's pending, and the doctor's
  queue updates instantly. A refund after payment is done by hand from the
  Razorpay dashboard.
- **Simulated gateway:** when no Razorpay keys are set, "Pay" completes
  instantly with a `test_…` payment ID. Setting the keys switches to real
  Razorpay test checkout with signature verification.
  - In Razorpay test mode, use any test card or UPI ID from Razorpay's docs,
    for example `success@razorpay`.

### 6.3 Notifications

The bell sits in the header on every page once you're signed in. Opening it
marks everything as read. Each item links to where you need to go.

| Event | Who is notified | Link |
| --- | --- | --- |
| Payment received | patient | waiting room |
| Doctor accepted | patient (plus email) | call page |
| Someone joined the call and is waiting | the other participant | call page |
| New chat message | the other participant | dashboard, with that chat open (`?chat=kind:id`) |
| Prescription issued | patient | dashboard → Prescriptions |
| Patient waiting (paid) | all approved doctors (live push + email) | doctor dashboard |

A notification is skipped if an identical unread one already exists. That way
call reconnects and message bursts don't flood the bell.

### 6.4 Chat and prescriptions

- Every appointment and every consultation has a message thread that only
  the patient and the treating doctor can use. The thread opens from the
  dashboards or from a notification.
- The treating doctor issues a prescription (medications with dosage,
  frequency, duration and instructions, plus notes) from **Prescribe**.
- Patients and prescribing doctors can **Download PDF**
  (`GET /prescriptions/{id}/pdf`). The PDF is a single A4 page.

### 6.5 Appointments

- Book by doctor (`POST /appointments`) or by service at a clinic
  (`POST /appointments/by-service`), for a date and an AM or PM slot.
- Bookings respect the doctor's weekly availability grid and optional daily
  limit.
- A Google Calendar event with a Meet link is created. The in-app video call
  at `/call/appointment/{id}` also works.
- Both sides can cancel. The appointment is synced to Medplum as an
  Appointment resource.

### 6.6 Family profiles

- `/family` lets you add members with name, relationship, date of birth and
  gender. Each member gets a Medplum Patient when they're first needed.
- Checks, appointments and consultations can be *for* a family member.
- **Invite:** a member with an email address can be invited to activate
  their own login (`/activate-family`). Health checks are then shared both
  ways.

### 6.7 Doctor onboarding and admin

1. A signed-in user applies at `/apply-doctor`.
2. An admin approves them in `/admin`. This creates a Medplum Practitioner.
3. The admin assigns the doctor to clinics (PractitionerRole) and manages
   clinics, services, fees and blog posts. The **Overview** tab shows
   telemedicine earnings: all-time total, this month, and the number of paid
   consultations. Only paid consultations count.
4. The doctor sets availability, fee, languages and a daily limit on their
   dashboard.

---

## 7. Medplum FHIR integration

Every sync runs in the background and on a best-effort basis. A Medplum
outage is logged but never blocks or undoes the action in Symptora.

| Symptora event | FHIR resource |
| --- | --- |
| Patient signs up / family member first used | `Patient` |
| Doctor approved | `Practitioner` |
| Clinic created or updated | `Organization` |
| Doctor assigned to clinic | `PractitionerRole` |
| Symptom check | `RiskAssessment` (conditions + probabilities) |
| Appointment booked | `Appointment` |
| Consultation accepted | `Encounter` (class *virtual*, `in-progress`) |
| Consultation completed | `Encounter` patched to `finished` |
| Chat message | `Communication` (sender/recipient, linked to the Encounter) |
| Prescription issued | one `MedicationRequest` per medication |

The client lives in `backend/app/utils/integration/medplum/index.py`. It
authenticates with OAuth2 client credentials, and `create_resource` /
`patch_resource` work for any resource type.

---

## 8. API reference

All paths are prefixed with **`/api/v1`**. Authenticated routes need
`Authorization: Bearer <token>`. WebSockets take `?token=<token>`. Full
schemas are at `/docs`.

<details><summary><b>Users & auth</b> — <code>/users</code></summary>

| Method | Path | |
| --- | --- | --- |
| POST | `/users/register/request-otp` | step 1: email OTP |
| POST | `/users/register/verify` | step 2: create account |
| POST | `/users/login` | returns an access token |
| GET / PATCH | `/users/me` | profile (and avatar) |
| POST | `/users/password/forgot` · `/verify` · `/reset` | password reset via OTP |
| POST | `/users/family-invite/request` · `/accept` | a family member activates their login |
</details>

<details><summary><b>Symptom checker</b></summary>

| Method | Path | |
| --- | --- | --- |
| GET | `/symptoms` | all 131 known symptoms |
| POST | `/symptoms/parse` | free text → symptoms, suggestions, duration, red flags |
| POST | `/predict` | top 3 conditions + urgency. Saves the check; auto-escalates on High. |
| GET | `/checks` | history (yours plus family's, shared both ways) |
</details>

<details><summary><b>Telemedicine</b></summary>

| Method | Path | |
| --- | --- | --- |
| POST | `/telemedicine` | patient starts a consultation (unpaid) |
| POST | `/telemedicine/{id}/payment/order` | create a Razorpay or simulated order |
| POST | `/telemedicine/{id}/payment/confirm` | verify the payment; the request goes live to doctors |
| GET | `/telemedicine/pending` | doctor: paid queue, escalated first |
| POST | `/telemedicine/{id}/accept` | doctor: claim it (first wins) |
| PATCH | `/telemedicine/{id}/cancel` · `/complete` | |
| GET | `/telemedicine/me` · `/telemedicine/doctor/me` · `/telemedicine/{id}` | lists / detail |
| WS | `/ws/telemedicine/doctor` · `/ws/telemedicine/patient/{id}` | live queue / accepted push |
| WS | `/ws/call/{appointment_id}` · `/ws/call/telemedicine/{id}` | WebRTC signaling |
</details>

<details><summary><b>Messages, prescriptions, notifications</b></summary>

| Method | Path | |
| --- | --- | --- |
| GET / POST | `/messages/appointment/{id}` · `/messages/telemedicine/{id}` | thread |
| POST | `/prescriptions` | doctor issues a prescription |
| GET | `/prescriptions/me` · `/doctor/me` · `/appointment/{id}` · `/telemedicine/{id}` · `/{id}` | lists / detail |
| GET | `/prescriptions/{id}/pdf` | PDF download |
| GET | `/notifications` | latest 30 |
| POST | `/notifications/read-all` | mark all as read |
</details>

<details><summary><b>Appointments, clinics, doctors, family, admin, blog</b></summary>

| Method | Path | |
| --- | --- | --- |
| POST | `/appointments` · `/appointments/by-service` | book |
| GET | `/appointments/me` · `/appointments/doctor/me` | lists |
| PATCH | `/appointments/{id}/cancel` | |
| GET | `/clinics` · `/clinics/directory` · `/services` | public directory |
| POST | `/doctor/promote` | apply to become a doctor |
| GET / PATCH | `/doctor/me` | own application / profile |
| GET | `/doctor/{id}/public` · `/doctor/my-clinics` | |
| GET / PATCH | `/doctor/pending` · `/doctor/{id}/approve` · `/reject` | admin review |
| GET / POST / PATCH / DELETE | `/family-members[/{id}]` · `POST /{id}/invite` | family |
| * | `/admin/stats` · `/admin/patients` · `/admin/doctors` · `/admin/clinics` · `/admin/services` | admin |
| * | `/blogs` · `/admin/blogs` | blog |
</details>

---

## 9. The symptom model

- **Data:** `backend/data/raw/`, a public symptom→disease dataset (41
  diseases, 131 symptoms, severity weights, descriptions, precautions).
  `ml/clean.py` normalizes it into `data/processed/`.
- **Training:** `uv run python ml/train.py`
  - Trains **logistic regression** on the real rows plus random
    partial-symptom copies, because real users enter only 2–4 symptoms.
  - Prints held-out top-1 and top-3 accuracy for full input and for 2, 3 and
    4 symptoms.
  - Saves `ml/artifact/model.joblib`, `symptoms.json` and `diseases.json`.
- **Common-disease weighting:** the dataset lists every disease equally
  often. `predictionService.py` therefore scales probabilities by how common
  each disease is (three hand-picked tiers), so vague input like "headache"
  doesn't rank a brain hemorrhage first. Specific combinations still find
  serious conditions.
- **Parser:** `app/services/symptomParser.py` is rule-based. To improve how
  it reads plain language, add phrases to `SYNONYMS`, `AMBIGUOUS` or
  `RED_FLAGS`. The tests guard against regressions.
- **Ceiling:** 41 diseases is small. Colds vs. flu vs. COVID, pediatrics and
  mental health are outside what it knows. Treat the output as guidance only.

---

## 10. Testing

```bash
cd backend
uv run pytest -q                      # full suite (in-memory SQLite, no external services)
uv run pytest -q tests/test_telemedicine.py   # consult, payment, notifications, PDF
```

| Test file | Covers |
| --- | --- |
| `test_telemedicine.py` | start / pay / accept races, the unpaid-queue rule, Razorpay signature check, join and message notifications, PDF |
| `test_prediction.py`, `test_symptom_parser.py` | model quality floor, urgency rules, rare-disease ranking, parser wording and typos |
| `test_appointments.py`, `test_messages.py`, `test_prescriptions.py`, `test_family_checks.py`, … | access rules and flows |

Frontend: `cd client && pnpm build` (type-check + build), and
`cd frontend-app && npx tsc --noEmit`.

---

## 11. Deployment

| Piece | Where it runs now | Notes |
| --- | --- | --- |
| API | Render (`symptora-first-commit.onrender.com`) | start command `uvicorn main:app --host 0.0.0.0 --port $PORT`; run `alembic upgrade head` on deploy; set `RENDER_EXTERNAL_URL` for keep-alive; use `BREVO_API_KEY` for email |
| Database | Neon PostgreSQL | pooled connection string in `DATABASE_URL` |
| Web | Vercel (`symptora-ten.vercel.app`) | `vercel.json` rewrites every route to `index.html`; set `VITE_API_URL` |
| Mobile | Expo / EAS | set `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WEB_URL` in the EAS environment |

**Run a single worker.** The live queue, notification pushes and call rooms
are kept in the server's memory. Two or more workers or instances would split
them. To scale out, move them to Redis pub/sub first.

**Going live with payments:** swap in live Razorpay keys, and handle refunds
(for example, by listening for Razorpay's refund events).

---

## 12. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Patient sees "Connecting you to a doctor" but the doctor sees nothing | The consultation is **unpaid**, or the browser is showing an old copy of the page. Hard-refresh the patient page (Ctrl+Shift+R). It switches to **Pay ₹…** within 4 seconds if unpaid. Once paid, the doctor's dashboard shows it within 10 seconds. |
| Doctor dashboard has no "Instant consultation requests" section | The doctor isn't **approved** yet. An admin approves them in `/admin`. |
| `503 Symptom checker is not available` | Model files are missing. Run `uv run python ml/train.py`. |
| Payment says "could not be verified" | With Razorpay keys set, both the key ID and the secret must be from the **same** test account. Without keys, only `test_…` payment IDs are accepted. |
| Mobile app: "Card payment is available on the website" | Razorpay keys are set on the server. In-app card payment needs `react-native-razorpay` and a custom build. For now, use the simulated gateway or pay on the web. |
| `401` after about 30 minutes | Access tokens expire (`ACCESS_TOKEN_EXPIRE_MINUTES`). Log in again. |
| CORS error from a new domain | Add it to `CORS_ORIGINS`. |
| Emails not arriving on Render | SMTP ports are blocked there. Set `BREVO_API_KEY`. |
| App call opens but the two sides can't see each other | Both sides must use the **same backend**. The app's calls open `EXPO_PUBLIC_WEB_URL` (the production site by default), which talks to the production API. So test app calls against the deployed web app, not `localhost`. On mobile data, also set a TURN server (`VITE_TURN_*`). |
| Phone can't reach the API | Use your LAN IP or a tunnel in `EXPO_PUBLIC_API_URL`, not `localhost`. |
| Tab shows the Vite/React icon | Cached favicon. Hard-refresh; the icon links carry a `?v=` cache-buster. |

---

## 13. Known limits and next steps

- **Refunds** for cancelled paid consultations are done by hand.
- **Real-time state is in memory,** so the server must run as a single worker
  (Redis pub/sub to scale).
- **Mobile app:** no notification bell, and no in-app card payment yet.
- **Symptom model coverage** is limited to 41 diseases. A larger clinical
  dataset, or an LLM-assisted triage layer with the current rules as a safety
  net, is the next big step.
- **Prescription PDF** is one page, text only.
- **Sessions** have no refresh token; users log in again after the access
  token expires.
