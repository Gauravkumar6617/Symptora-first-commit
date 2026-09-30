# Symptora Mobile

Expo (React Native) app for Symptora patients and doctors: health check,
telemedicine (pay + waiting room; the video call opens the web call page in
an in-app browser), appointments, family, profile.

```bash
cat > .env <<'EOF'
EXPO_PUBLIC_API_URL=http://<your-LAN-IP>:8000
EXPO_PUBLIC_WEB_URL=https://symptora-ten.vercel.app
EOF
npm install
npx expo start
```

- Routes (file-based): `src/app/` — `(patient)`, `(doctor)`, `(auth)`, `(info)`
- API client: `src/lib/api.ts`, types: `src/types/index.ts`
- Design tokens (shared palette with the web): `src/constants/theme.ts`

See [docs/GUIDE.md](../docs/GUIDE.md) for the full guide.
