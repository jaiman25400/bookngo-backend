# BookNGo Backend Setup & Onboarding Guide

How to run the backend and how to register a new business (e.g. ski resort) and its first admin and team—**without email**. Users are created with a default or chosen password and can log in immediately.

---

## 1) Local Environment Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm

### Install and run
```bash
npm install
npm run start:dev
```

### Environment variables
Create a `.env` file in the backend root:

```
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=your_password
DB_NAME=bookngo_db
DB_SYNC=true
DB_LOG=false

# Auth
JWT_SECRET=replace-with-a-strong-secret

# CORS
FRONTEND_URL=http://localhost:3001
CMS_FRONTEND_URL=http://localhost:3002
```

**Note:** Email (SMTP) is not used in the current flow. Invite emails are disabled; users get a default or provided password and log in directly.

---

## 2) How to Register a New Ski Resort (New Business)

You need to:

1. Create the **customer** (business) in the database.
2. Create the **first admin user** via API (no email; set password in request or use default).
3. Optionally add **team members** from CMS (logged-in admin) or via API.

---

### Step 1 — Create the customer in the database

Use your SQL client (e.g. pgAdmin, DBeaver, `psql`) and run:

```sql
-- Insert customer (business). Use RETURNING id to get the new ID.
INSERT INTO "BookNGo_CMS"."customers" (customer_name, business_type, is_active)
VALUES ('Rocky Mountain', '{Winter}', true)
RETURNING id;
```

Note the returned `id` (e.g. `4`).

Then create the customer detail (replace `4` with your customer id):

```sql
INSERT INTO "BookNGo_CMS"."customer_details"
  (customer_id, customer_display_name, customer_slug)
VALUES
  (4, 'Rocky Mountain', 'rocky-mountain');
```

- `customer_slug` must be unique and URL-friendly (e.g. `rocky-mountain`). It is used in public URLs.
- If you get a duplicate key error on `customers.id`, the sequence may be out of sync. Fix it with:

```sql
SELECT setval(
  pg_get_serial_sequence('"BookNGo_CMS"."customers"', 'id'),
  (SELECT COALESCE(MAX(id), 1) FROM "BookNGo_CMS"."customers"),
  true
);
```

---

### Step 2 — Create the first admin user (no email)

Call the **public** invite-by-admin endpoint. The user is created **active** and can log in immediately. You can use a fake email (e.g. `admin@rocky.local`).

**Option A — Set your own password (recommended)**

```http
POST http://localhost:3000/customer-users/inviteUserByAdmin
Content-Type: application/json

{
  "email": "admin@rocky.local",
  "name": "Rocky Admin",
  "customer": 4,
  "role": "Admin",
  "password": "YourSecurePassword123"
}
```

Replace `4` with your customer id from Step 1.

**Option B — Use default password**

Omit `password`; the user will have default password `TempPass123!`:

```json
{
  "email": "admin@rocky.local",
  "name": "Rocky Admin",
  "customer": 4,
  "role": "Admin"
}
```

**Postman**
- Method: **POST**
- URL: `http://localhost:3000/customer-users/inviteUserByAdmin`
- Headers: `Content-Type: application/json`
- Body: raw JSON as above

**Response (example):**
```json
{
  "message": "User created successfully. They can log in with the provided or default password.",
  "data": {
    "message": "...",
    "email": "admin@rocky.local",
    "defaultPassword": "TempPass123!"
  }
}
```

No email is sent. The admin can log in right away.

---

### Step 3 — Log in as the admin

```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "admin@rocky.local",
  "password": "YourSecurePassword123"
}
```

(or `TempPass123!` if you used the default).  
Use the same URL from the CMS frontend (e.g. `http://localhost:3002`) so the session cookie is set for the CMS.

---

### Step 4 — Add team members (same customer)

**From CMS (logged in as admin)**  
Use the Team / Invite flow in the CMS; it calls:

```http
POST http://localhost:3000/customer-users/invite
Cookie: <your session cookie>
Content-Type: application/json

{
  "email": "staff@rocky.local",
  "name": "Staff User",
  "role": "Team",
  "password": "OptionalStaffPass123"
}
```

- If you omit `password`, the user gets default password `TempPass123!`.
- No email is sent; they can log in immediately with that password.

**From Postman (without CMS UI)**  
You must be logged in first (e.g. copy the `token` cookie from a successful login response or browser). Then send the same `POST /customer-users/invite` with that cookie and body.

---

## 3) Summary: Register a new ski resort

| Step | Action |
|------|--------|
| 1 | Insert row into `BookNGo_CMS.customers`, then `BookNGo_CMS.customer_details`. Note `customer.id`. |
| 2 | `POST /customer-users/inviteUserByAdmin` with `email`, `name`, `customer` (id), `role`, and optional `password`. |
| 3 | Log in with `POST /auth/login` (email + password you set or `TempPass123!`). |
| 4 | Add team via CMS (or `POST /customer-users/invite` with auth cookie and optional `password`). |

No email is sent; all users are created active and use the provided or default password.

---

## 4) Default password (development only)

When no `password` is sent for invite or inviteUserByAdmin, new users get:

- **Default password:** `TempPass123!`

Change it later via a “change password” flow in the CMS when you add one, or create users with a `password` field to avoid the default.

---

## 5) Re-enabling email invites later

The code that sent invite emails is commented out in `CustomerUsersService`. To re-enable:

1. Restore the `sendInviteEmail` implementation (and any nodemailer usage).
2. In `inviteUser`, switch back to token-based flow: set `is_active: false`, set `password_token`, call `sendInviteEmail`, and do not set a default password.
3. Ensure `.env` has valid SMTP settings and `CMS_FRONTEND_URL` for the setup-password link.

Until then, the app runs without email and relies on default or provided passwords only.

---

## 6) Troubleshooting

| Issue | Check |
|-------|--------|
| Duplicate key on `customers.id` | Run the `setval` snippet in Step 1 to fix the sequence. |
| Admin cannot log in | Ensure Step 2 returned success and you use the same email/password (or `TempPass123!`). |
| 401 on `/customer-users/invite` | Log in first and send the request with the cookie (or auth header) that the CMS uses. |

---

## 7) Why a resort doesn’t show on the frontend (/skiing or /Ontario)

The frontend uses two backend APIs to list resorts. A resort only appears if the data matches what these APIs expect.

### **Skiing page** (`/skiing` or `/user/ski-slopes/skiing-customers`)

The API returns only customers that:

1. Have **at least one activity** in `BookNGo_CMS.activities` with:
   - `activity_type` = `'skiing'` or `'snowboarding'`
   - `is_active` = `true`
2. Have **latitude and longitude** set in `BookNGo_CMS.customer_details`:
   - `customer_latitude` IS NOT NULL
   - `customer_longitude` IS NOT NULL

**If your 3rd resort is missing:**  
Add at least one skiing/snowboarding activity for that customer in the CMS (or in `activities`), and set `customer_latitude` and `customer_longitude` in `customer_details` for that resort.

### **Region page** (e.g. `/Ontario` or `/user/ski-slopes?region=Ontario`)

The API returns customers where:

- `BookNGo_CMS.customer_details.customer_state` equals the region requested (e.g. `'Ontario'`).

The value is case-sensitive and must match what the frontend sends (e.g. `Ontario` vs `ON`).

**If your 3rd resort is missing:**  
Set `customer_state` on that resort’s row in `customer_details` to the exact region string the frontend uses (e.g. `'Ontario'`).

### Quick checklist for a new resort to appear

| Requirement | Table | Column(s) |
|-------------|--------|-----------|
| Has at least one skiing/snowboarding activity | `BookNGo_CMS.activities` | `activity_type` IN ('skiing','snowboarding'), `is_active` = true, `customerId` = customer id |
| Has coordinates | `BookNGo_CMS.customer_details` | `customer_latitude`, `customer_longitude` NOT NULL |
| In region list (e.g. Ontario) | `BookNGo_CMS.customer_details` | `customer_state` = e.g. `'Ontario'` |

---

## CMS login not working in production (“Unable to connect to the server”)

If the onboarding API works (e.g. from Postman) but **CMS login fails** in the deployed frontend with “Unable to connect to the server”, the browser is not able to reach the backend or is blocked by CORS.

### 1. Backend (Render) – CORS

The backend only allows requests from origins set in env vars. Add your **CMS frontend URL**:

1. **Render** → your backend service → **Environment**.
2. Set **`CMS_FRONTEND_URL`** to the **exact** URL of the CMS app in the browser (no trailing slash), e.g.:
   - `https://bookngo-fe-gdaofke1s-jaiman25400s-projects.vercel.app`
   - or your production CMS URL like `https://bookngo-cms.vercel.app`
3. If you have a separate user frontend, set **`FRONTEND_URL`** to that URL.
4. Save and **redeploy** the backend.

### 2. Frontend (Vercel) – API base URL

The CMS frontend must call your **deployed** backend, not localhost:

1. **Vercel** → your CMS frontend project → **Settings** → **Environment Variables**.
2. Set the variable that holds the **API / backend base URL** (e.g. `NEXT_PUBLIC_API_URL`, `VITE_API_URL`, or `REACT_APP_API_URL`) to:
   - `https://bookngo-backend-pqx1.onrender.com`
3. Redeploy the frontend if needed.

### 3. Cold start (Render free tier)

On the free tier the backend can spin down. The **first** request after idle may take 30–60 seconds and can timeout. Try logging in again after a short wait, or hit the backend health endpoint first to wake it: `GET https://bookngo-backend-pqx1.onrender.com/health/cms`.

---

## Connect pgAdmin to Render PostgreSQL (from your machine)

Use the **External** connection details; the Internal URL only works from inside Render.

### 1. In pgAdmin

1. Right‑click **Servers** → **Register** → **Server**.
2. **General** tab: Name = e.g. `BookNGo Render`.
3. **Connection** tab:

| Field    | Value |
|----------|--------|
| Host     | `dpg-d6j1fbhdrdic73ajf5t0-a.oregon-postgres.render.com` |
| Port     | `5432` |
| Maintenance database | `bookngo_db` |
| Username | `bookngo_db_user` |
| Password | `AFB8WNkwhS3lTyvgJZnBRG2grzGgE1ao` (tick “Save password” if you want) |

4. **Save** (optional): enable “Save password”.
5. Click **Save**.

### 2. After connecting

- Your data is under **Databases** → **bookngo_db** → **Schemas** → **BookNGo_CMS** (and **BookNGo_Users**).
- If connection fails: check firewall/VPN; Render’s external DB is reachable from the internet on port 5432.
