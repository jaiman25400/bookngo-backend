# Ice Skating Client Onboarding API

This document describes how to use the **automated onboarding API** to create a full ice skating client (customer, admin user, zone, skating activity, and skate rentals) in one request. It is intended for **development and demo** use to quickly seed data.

---

## Base URL

- **Local:** `http://localhost:3000`
- **Production:** Your deployed backend URL (e.g. `https://your-app.onrender.com`)

All onboarding endpoints are **public** (no authentication required).

---

## 1. Onboard a new ice skating client

Creates a complete ice skating venue: customer record, customer details, one admin user, one zone, one skating activity (with schedules), and skate rentals inventory.

### Endpoint

```
POST /user/onboarding/ice-skating-client
```

### Request headers

| Header          | Value             |
|-----------------|-------------------|
| `Content-Type`  | `application/json` |

### Request body

| Field      | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `name`    | string | Yes      | Organization/venue name (e.g. "Nathan Phillips Skate Rentals") |
| `city`    | string | Yes      | City (e.g. "Toronto") |
| `latitude`  | number | Yes      | Latitude (-90 to 90) |
| `longitude` | number | Yes      | Longitude (-180 to 180) |
| `state`   | string | No       | Region for filtering (e.g. "Ontario"). Defaults to **Ontario** if omitted. |

### Example request (cURL)

```bash
curl -X POST http://localhost:3000/user/onboarding/ice-skating-client \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nathan Phillips Skate Rentals",
    "city": "Toronto",
    "latitude": 43.6521084,
    "longitude": -79.3839225,
    "state": "Ontario"
  }'
```

### Example request (Postman)

- **Method:** POST  
- **URL:** `{{baseUrl}}/user/onboarding/ice-skating-client`  
- **Body:** raw → JSON:

```json
{
  "name": "Nathan Phillips Skate Rentals",
  "city": "Toronto",
  "latitude": 43.6521084,
  "longitude": -79.3839225,
  "state": "Ontario"
}
```

### Success response (200)

```json
{
  "customer_id": 6,
  "admin_user_id": 10,
  "zone_id": 8,
  "activity_id": 12,
  "message": "Ice skating client onboarded. Admin login: nathanphillipsskaterentals@gmail.com / BookNGO@123"
}
```

### What gets created

| Entity | Details |
|--------|---------|
| **Customer** | `customer_name` = request `name`, `business_type` = `["Winter"]` |
| **Customer detail** | Display name, city, state (Ontario by default), lat/long, slug derived from name |
| **Admin user** | Email = slug (no hyphens) + `@gmail.com`, password = **BookNGO@123**, role = Admin |
| **Zone** | One zone: "Ice Skating Rink" (active) |
| **Activity** | "Skating", type = skating, **$10** base price, **3 hours** duration, **anytime** booking (no slots), active Feb 1 2026 – Feb 1 2027 |
| **Schedules** | Mon–Fri 9:00–21:00; Sat–Sun 9:00–23:00 |
| **Rentals** | "Skate Rentals": **$15/hour**, 20 total (Men 8: 10, Women 8: 10) |

---

## 2. Reset admin password (dev/demo only)

If an onboarded client’s admin cannot log in (e.g. password was not set correctly), you can reset the admin password to **BookNGO@123** for that customer.

### Endpoint

```
POST /user/onboarding/reset-admin-password
```

### Request body

| Field         | Type   | Required | Description |
|---------------|--------|----------|-------------|
| `customer_id` | number | Yes      | Customer ID from the onboarding response |

### Example request (cURL)

```bash
curl -X POST http://localhost:3000/user/onboarding/reset-admin-password \
  -H "Content-Type: application/json" \
  -d '{"customer_id": 6}'
```

### Success response (200)

```json
{
  "email": "nathanphillipsskaterentals@gmail.com",
  "message": "Password reset. Login with nathanphillipsskaterentals@gmail.com / BookNGO@123"
}
```

---

## Admin login (CMS)

After onboarding (or after reset), the client’s admin can log in to the CMS with:

- **Email:** From the onboarding response message (e.g. `nathanphillipsskaterentals@gmail.com`)  
- **Password:** `BookNGO@123`

Use the normal CMS login endpoint (e.g. `POST /auth/login` with `email` and `password` in the body).

---

## Notes

- **Unique name:** Each onboarding uses `name` to generate a unique slug and email. Use a different `name` for each venue to avoid duplicate-email errors.
- **State:** Omit `state` to default to **Ontario**; include it (e.g. `"state": "Ontario"`) to control region filtering (e.g. for `GET /user/ski-slopes?region=Ontario&activityType=skating`).
- **Transaction:** The whole onboarding runs in a single database transaction; if any step fails, nothing is committed.
- **Public endpoints:** These endpoints do not require authentication. Restrict access in production (e.g. via network or API gateway) if needed.
