# Vercel + Neon: Environment Variables (Backend)

Use this when the backend runs on **Vercel** and uses **Neon** as the only database.  
Do **not** keep any env vars that point at the old Render Postgres.

---

## Single source of truth for the database

The backend uses **one** of these, in order:

1. **`DATABASE_URL`** (preferred)
2. **`POSTGRES_URL`** (if DATABASE_URL is not set; same format)

Both should point to **Neon** (pooler URL with SSL).  
It does **not** use `DB_HOST` / `DB_USER` / etc. when a URL is set.

---

## What to have on Vercel (backend project)

### Keep (required for Neon + app)

| Variable | Source | Purpose |
|----------|--------|---------|
| **`DATABASE_URL`** | Neon | Primary DB connection (pooler, with `sslmode=require`). **Keep.** |
| **`DB_SYNC`** | Manual | `true` only for first deploy to create tables; then `false`. |
| **`DB_LOG`** | Manual | `false` in prod (or `true` only when debugging). |
| **`JWT_SECRET`** | Manual | Same value as your frontends (e.g. CMS middleware). |
| **`FRONTEND_URL`** | Manual | `https://bookngo-user-fe.vercel.app` (CORS). |
| **`CMS_FRONTEND_URL`** | Manual | `https://bookngo-fe-cms.vercel.app` (CORS). |
| **`NODE_ENV`** | Manual | `production`. |

### Optional (from Neon; not required by this app)

You can **keep** these if other tools or future code use them; the backend does not read them:

- `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`, `DATABASE_URL_UNPOOLED`
- `POSTGRES_USER`, `POSTGRES_HOST`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE`
- `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`
- `NEON_PROJECT_ID`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NO_SSL`

### Remove (point at old Render DB)

Remove these so nothing points at the suspended Render Postgres:

| Variable | Why remove |
|----------|------------|
| **`DB_HOST`** | Was Render host; now you use Neon via `DATABASE_URL`. |
| **`DB_PORT`** | Not used when `DATABASE_URL` is set. |
| **`DB_USER`** | Was Render user; Neon uses `neondb_owner` in the URL. |
| **`DB_PASS`** | Was Render password; do not leave old DB credentials in Vercel. |
| **`DB_NAME`** | Was `bookngo_db` on Render; Neon DB name is in the URL. |

After removal, the app will use only **`DATABASE_URL`** (or **`POSTGRES_URL`**) for the database.

---

## Optional: SMTP / email

If you use email (e.g. invites), keep:

- `EMAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`  
(and mark secrets as **Secret** in Vercel.)

---

## Checklist

1. In Vercel → backend project → **Environment Variables**:
   - **Delete:** `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`.
   - **Keep:** `DATABASE_URL` (Neon), `DB_SYNC`, `DB_LOG`, `JWT_SECRET`, `FRONTEND_URL`, `CMS_FRONTEND_URL`, `NODE_ENV` (and optional Neon vars / SMTP if you use them).
2. Redeploy the backend so the new env is applied.
3. Hit `https://bookngo-backend.vercel.app/health/cms` and confirm `"db":"up"`.
