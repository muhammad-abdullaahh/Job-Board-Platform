# Job Board Platform - Internal Admin CMS

Internal Admin Content Management System (CMS) for the Job Board Platform built with **Payload CMS 3.x**, **Next.js 15/16 App Router**, and **TypeScript**.

## Architectural Principles

1. **FastAPI Single Source of Truth**: The Job Board data (companies, jobs, applications, candidate users, audit trail) resides in the FastAPI backend (`JOB_BOARD_API_URL`). The CMS **never** directly connects to the job board platform database; it interacts purely over secure HTTP with typed API contracts and structured audit actor headers (`X-CMS-Actor`).
2. **Dedicated CMS Auth Database**: Payload CMS maintains its **own isolated PostgreSQL database** (`CMS_DATABASE_URL`), storing exclusively internal CMS staff accounts and session tokens. It never reads or binds to `DATABASE_URL`.
3. **Strict Zero Public Surface**: The CMS exposes no public routes. Requests to `/` are immediately redirected to `/admin`. All crawler activity is rejected via `robots.txt` and `X-Robots-Tag: noindex, nofollow` headers.
4. **Read-Only Safety Switch (`CMS_READ_ONLY`)**: Defaults to `"true"`. When active, every mutating operation (`POST`, `PATCH`, `DELETE`) is intercepted and rejected at the server boundary before any network request leaves the server. Action buttons in the UI are disabled. Set to `"false"` deliberately when ready to execute live modifications.

---

## Environment Variables

| Variable | Required | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `PAYLOAD_SECRET` | **Yes** | Min 32 characters string | Cryptographic key used by Payload to sign JWTs and session tokens. |
| `CMS_DATABASE_URL` | **Yes** | `postgresql://postgres:postgres@localhost:5432/cms_dev` | Connection string for Payload's dedicated PostgreSQL database (staff only). |
| `JOB_BOARD_API_URL` | **Yes** | `https://job-board-platform-pi.vercel.app` | Base URL of the live FastAPI backend. |
| `CMS_SERVICE_EMAIL` | **Yes** | `cms-service@jobboard.internal` | Service account email used by the server-side proxy client to log in to FastAPI. |
| `CMS_SERVICE_PASSWORD`| **Yes** | `(service account password)` | Service account password for FastAPI authentication. |
| `CMS_PUBLIC_URL` | **Yes** | `http://localhost:3000` | The public origin of the CMS; used to restrict CORS and CSRF origins (no wildcards). |
| `CMS_READ_ONLY` | **Yes** | `true` | Safety switch. When `"true"`, blocks all mutations at server boundary. |
| `STAFF_EMAIL` | For script | `admin@jobboard.internal` | Target email for `scripts/create-staff.ts` initial staff bootstrap. |
| `STAFF_PASSWORD` | For script | Min 14 characters string | Target password for `scripts/create-staff.ts` initial staff bootstrap. |

---

## Local Setup & Quickstart

Follow these exact steps to run the CMS locally:

### 1. Install Dependencies
```bash
cd cms
npm install
```

### 2. Create the Local PostgreSQL Database
Ensure PostgreSQL is running locally on port 5432, then create an empty database named `cms_dev`:
```bash
# Using psql:
psql -U postgres -c "CREATE DATABASE cms_dev;"
```

### 3. Configure `.env`
Copy the template and configure your real secrets (never commit this file):
```bash
cp .env.example .env
```
Populate `.env` with your `PAYLOAD_SECRET` (min 32 chars), `CMS_DATABASE_URL`, `CMS_SERVICE_EMAIL`, and `CMS_SERVICE_PASSWORD`.

### 4. Fetch Live API Schema & Generate Types
```bash
npm run gen:api
```
This contacts `${JOB_BOARD_API_URL}/openapi.json` and outputs strongly-typed interfaces into `src/lib/jobboard/types.ts`.

### 5. Run Database Migrations
Apply the initial schema migration for the `staff` collection and session tables:
```bash
npm run payload migrate
```

### 6. Create the First Admin Staff User
Bootstrap the initial administrator account without needing the browser setup screen:
```bash
npm run create-staff
```
*(Requires `STAFF_EMAIL` and `STAFF_PASSWORD` [min 14 chars] in `.env`).*

### 7. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000/admin](http://localhost:3000/admin) in your browser and sign in with your staff credentials.

---

## Admin Screens & FastAPI Endpoint Mapping

| Admin Screen | Path | FastAPI Endpoints Invoked | Allowed Roles | Features |
| :--- | :--- | :--- | :---: | :--- |
| **Platform Overview** | `/admin` | `GET /api/v1/admin/analytics` | `moderator`, `admin` | Platform health KPIs, user/job counts, application status breakdown, and prominent pending company verification count. |
| **Companies Moderation** | `/admin/companies` | `GET /api/v1/admin/companies`<br>`POST /api/v1/admin/companies/{id}/verify`<br>`POST /api/v1/admin/companies/{id}/unverify`<br>`DELETE /api/v1/admin/companies/{id}` | Read/Verify/Unverify: `moderator`, `admin`<br>Delete: `admin` only | Filter pending/verified, name search, detailed company view, verification toggle, and typed-name deletion confirmation. |
| **Jobs Moderation** | `/admin/jobs` | `GET /api/v1/admin/jobs`<br>`PATCH /api/v1/admin/jobs/{id}/status`<br>`DELETE /api/v1/admin/jobs/{id}` | Status update: `moderator`, `admin`<br>Delete: `moderator`, `admin` | Filter by status/company/keyword, change status (open/closed/draft), and typed-title deletion confirmation. |
| **Applications Review**| `/admin/applications`| `GET /api/v1/admin/applications` | `moderator`, `admin` | Read-only inspection with status, job, applicant, company, and date range filters; cover letter viewer. |
| **User Lifecycle** | `/admin/users` | `GET /api/v1/admin/users`<br>`GET /api/v1/admin/users/{id}`<br>`POST /api/v1/admin/users/{id}/lock`<br>`POST /api/v1/admin/users/{id}/unlock`<br>`DELETE /api/v1/admin/users/{id}` (`?hard=true`) | Lock/Unlock: `moderator`, `admin`<br>Soft/Hard Delete: `admin` only | Search by name/email, active/locked filter, mandatory lock reason modal. Admin accounts are protected with actions hidden. Hard delete only enabled if already locked or soft-deleted. |
| **System Audit Logs** | `/admin/audit-logs` | `GET /api/v1/admin/audit-logs` | `moderator`, `admin` | Read-only chronological audit trail with filters for action type, target resource, target ID, and date range. |
| **Staff Accounts** | `/admin/collections/staff`| Payload Local API / Postgres | Create/Update/Delete: `admin` only<br>Read: `moderator`, `admin` | Manage CMS internal staff members, assign roles (`admin` or `moderator`), max 5 login attempts, 10 min lock time. |

---

## Testing

Run the Vitest test suite covering token caching, single-flight mutex, 401 retry, read-only switch, and role authorizations:
```bash
npm test
```
