# BookNGo Backend – New Developer Guide

Welcome to the BookNGo backend codebase. This guide gives you the context you need to navigate the project and get a local environment up and running quickly. It covers the overall architecture, key modules, and the initial setup workflow (including database, environment variables, and tooling).

---

## High-Level Overview

- **Framework**: [NestJS](https://nestjs.com/) (v11) running on Node.js, structured around modules, controllers, and services.
- **API Domains**:
  - `src/modules/cms/…`: Admin-facing CMS features (customers, activities, inventory, zones, users, authentication).
  - `src/modules/user/…`: End-user features (ski slopes, vendor catalogue, bookings).
- **Database**: PostgreSQL using TypeORM (`@nestjs/typeorm`) for entity management and repository access.
- **Authentication**: JWT tokens issued during CMS login, enforced globally via a custom `JwtAuthGuard`. Public routes (e.g., login) opt-out with the `@Public()` decorator.
- **Validation & Serialization**: `class-validator` and `class-transformer` power DTO validation. A global `ValidationPipe` enables transformation, stripping unknown fields.
- **File Storage**: Uploaded media (activity images, etc.) is stored under the `/uploads` directory and exposed via a static Express mount.

---

## Key Project Structure

```
src/
  app.module.ts          # Root Nest module wiring configuration + feature modules
  config/database.ts     # TypeORM configuration sourced from environment variables
  main.ts                # App bootstrap (CORS, validation, JWT guard, static uploads)
  modules/
    cms/
      activities/        # Activity management (entities, DTOs, schedules, holidays)
      activity-zones/    # Zone definitions tied to activities
      auth/              # CMS authentication (login, JWT issuance, guards)
      customer-users/    # CMS user accounts, password hashing, etc.
      customers/         # Customer organizations / resorts
      inventory/         # Gear inventory management
    user/
      bookings/          # Booking availability + creation flow
      ski-slopes/        # Public slope listings
      vendors/           # Vendor directory exposed to end users
utils/
  common.helper.ts       # Shared helpers (file cleanup, etc.)
uploads/                 # Runtime file uploads served at /uploads
```

Each feature module follows Nest conventions:

- `*.module.ts` wires controllers and services with `TypeOrmModule.forFeature`.
- `*.controller.ts` handles routing to HTTP endpoints.
- `*.service.ts` encapsulates business logic, repository access, and transactional workflows.
- `dto/` contains request/response validators, ensuring consistent API contracts.
- `entities/` defines database models, relations, and enums.

---

## Technology & Configuration Highlights

- **TypeORM Entities** are configured to auto-load from `dist/**/*.entity{.ts,.js}` after compilation. In development you can turn on schema sync via `DB_SYNC=true`, but disable this in production.
- **JWT Guard** (`JwtAuthGuard`) is registered globally in `main.ts`. Use the `@Public()` decorator to mark routes that should bypass authentication.
- **CORS** is scoped to the URLs set in `FRONTEND_URL` and `CMS_FRONTEND_URL`. Make sure both are configured before running locally to avoid blocked requests.
- **File Uploads** leverage `multer` adapters. Uploaded files are saved into `uploads/` and cleaned up via helpers in `src/utils/common.helper.ts`.

---

## Local Development Setup

### 1. Prerequisites
- **Node.js** 18.x or newer (Nest CLI 11 requires active LTS or later).
- **npm** (ships with Node) or **pnpm/yarn** if you prefer—examples here use npm.
- **PostgreSQL** 14+ running locally or in Docker.
- (Optional) **Nest CLI** globally (`npm install -g @nestjs/cli`) for scaffolding.

### 2. Clone & Install
```bash
git clone https://github.com/<org>/BookNGo-BE.git
cd BookNGo-BE/bookngo-backend
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the project root (`bookngo-backend/.env`). Start from the template below and adjust values for your environment:

```
NODE_ENV=development
PORT=3000

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=bookngo_db
DB_SYNC=true         # Use only in local dev to auto-sync schemas
DB_LOG=true          # Enable SQL query logging if debugging

# Auth / JWT
JWT_SECRET=replace-with-a-strong-secret

# CORS Origins
FRONTEND_URL=http://localhost:4200        # e.g. Angular/React user app
CMS_FRONTEND_URL=http://localhost:4300    # e.g. CMS admin app
```

> **Tip**: Commit the `.env` filename to `.gitignore` if it isn’t already to avoid leaking secrets.

### 4. Prepare PostgreSQL
- Ensure PostgreSQL is running and accessible with the credentials above.
- Create the database if it does not already exist:
  ```sql
  CREATE DATABASE bookngo_db;
  ```
- Grant privileges to your configured user.

### 5. Seed Data (Optional)
There is no automated seeding script yet. You can:
- Use SQL inserts manually.
- Temporarily enable `DB_SYNC=true` to let TypeORM create tables, then insert data through the CMS UI or direct SQL.

### 6. Run the Development Server
```bash
npm run start:dev
```
- The API listens on `http://localhost:3000` by default.
- Static assets are available at `http://localhost:3000/uploads/<file>`.
- Logs will show SQL queries if `DB_LOG=true`.

### 7. Run Tests & Linting
```bash
npm run test          # Unit tests
npm run test:e2e      # End-to-end tests (requires a running DB)
npm run lint          # ESLint + Prettier integration
```

---

## Working With the Codebase

- **Adding Modules**: Use Nest CLI (`nest g resource`) to generate new modules following the existing structure.
- **Database Changes**: Prefer TypeORM migrations for production environments. Currently, schema sync is used for rapid development, but long-term planning should introduce versioned migrations.
- **Authentication**: Most routes require a valid JWT cookie. For new endpoints that must be public, decorate them with `@Public()`.
- **Error Handling**: Services use Nest exceptions (`BadRequestException`, `NotFoundException`, etc.) to propagate HTTP-friendly errors. Follow the same pattern when extending business logic.
- **File Handling**: When uploading new asset types, reuse or extend the helpers in `src/utils/common.helper.ts` to keep filesystem operations consistent.

---

## Deployment & Production Notes

- Build the compiled output with `npm run build`; artifacts live in `dist/`.
- Configure environment variables via your hosting platform (do **not** rely on `.env` files in production).
- Set `DB_SYNC=false` and manage schema changes via migrations to protect production data.
- Ensure `NODE_ENV=production`, `JWT_SECRET` is strong, and `FRONTEND_URL` / `CMS_FRONTEND_URL` resolve to deployed front-ends.
- Serve the `uploads/` directory from persistent storage or an object store if running stateless containers.

---

## Next Steps

1. Read through the module(s) you’ll work on (controllers → services → entities) to understand their flows.
2. Stand up the CMS frontend (see corresponding repo) to exercise authentication and administration flows against your local backend.
3. Coordinate with the team regarding seeding/migration strategy before making breaking schema changes.

Welcome aboard, and happy shipping!

