# Symptora Web

React 19 + Vite + TypeScript + Tailwind web app for Symptora: marketing
pages, symptom checker, telemedicine (payment, waiting room, WebRTC call),
appointments, family, doctor and admin dashboards.

```bash
echo "VITE_API_URL=http://localhost:8000" > .env
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # type-check + production build
```

- API calls and types: `src/lib/api.ts`
- Routes: `src/app/router.tsx`
- Pages: `src/pages/*`, shared UI: `src/components/*`

See [docs/GUIDE.md](../docs/GUIDE.md) for the full guide.
