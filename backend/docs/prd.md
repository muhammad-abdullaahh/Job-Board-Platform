# Job Board Platform — Product Requirements Document

**Status:** Built and deployed
**Owner:** Muhammad Abdullah
**Last updated:** matches current codebase

---

## 1. What this is

A web application that connects job seekers with companies. Job seekers browse and apply to jobs. Companies post and manage job listings, but only after an admin verifies them. Admins verify companies and manage users.

This file exists so that anyone (or any AI tool) working on this codebase later understands the product's actual intent without needing to open the full SRS or planning documents. If a future change conflicts with anything here, update this file — don't let the code silently drift from it.

## 2. Who uses it

| Role | Can do |
|---|---|
| Job Seeker | Register, build a profile with skills, browse/filter jobs, apply to jobs, track application status |
| Company Representative | Register a company under their existing account, wait for admin verification, then post/edit/delete their own jobs, review applicants |
| Admin | Just a regular user with `is_admin = true`. Verifies pending companies, manages users |

Important: a company is **not** a separate account type. The same login a job seeker already has can also manage a company, once verified — same model as LinkedIn.

## 3. Core rules that must never be violated

- A job seeker cannot apply to the same job twice.
- A company cannot post jobs until an admin verifies it.
- A company can only edit/delete/view applications for its own job postings, never another company's.
- A job seeker can only view/manage their own applications, never another user's.
- Passwords are always stored as bcrypt hashes, never in plain text or logs.
- Admin status is a flag on a user (`is_admin`), never a separate table or account type.

## 4. Tech stack (what this is actually built with)

- **Backend:** Python, FastAPI — organized into controller (routes) → service → repository layers
- **Database:** PostgreSQL, hosted on Supabase, accessed through SQLAlchemy (ORM) + Alembic (migrations)
- **Frontend:** React
- **Auth:** Email + password login, JWT access token (15 min) + a database-stored refresh token, so a session can be revoked before it naturally expires
- **Hosting:** Frontend and backend deployed together on Vercel; database on Supabase, accessed through Supabase's connection pooler (required for Vercel's serverless environment — do not switch to a direct connection without also removing the `NullPool` serverless handling in `database.py`)
- **API style:** REST, versioned under `/api/v1/`

## 5. What's in scope

- Registration and login (email/password)
- Job seeker profile with skills
- Company registration, linked to an existing user account, pending until admin approval
- Job posting, editing, deletion (company-owned only)
- Job browsing, searching, filtering
- Job applications, with duplicate-application prevention
- Application status tracking (both applicant and company side)
- A shared skill list, used by both profiles and job postings
- Admin: verify companies, manage users

## 6. What's explicitly out of scope (don't add without a deliberate decision)

- OAuth / social login (Google, GitHub) — was considered, dropped in favor of email/password for simplicity at this scale
- In-app messaging between users
- Resume file uploads
- Payment or monetization features
- A native mobile app (though the React frontend was deliberately built so a future React Native version could reuse its logic and structure)
- A caching layer (Redis) — deferred until real traffic justifies it

## 7. Known gaps / things to be aware of

- No social login — email/password only.
- Access token lifetime and refresh token behavior should be checked against `core/security.py` and `models/refresh_token.py` before assuming specifics, since these were tightened after the initial build.
- The application status workflow in the running code is more detailed than what was first planned — treat any further expansion of it as a deliberate decision, not a default.

## 8. Folder structure convention (backend)

Organized by technical layer, not by feature:

```
src/app/
├── routes/         → receives requests, validates shape, calls services
├── services/       → business rules and decisions (role checks, ownership checks, workflows)
├── repositories/   → database reads/writes only, no business logic
├── models/         → what each database table looks like
├── schemas/        → what a request/response is allowed to look like
├── dependencies/   → auth and role-check gatekeepers, run before route logic
├── exceptions/     → named, specific error types
├── core/           → security, logging, rate limiting, error handling
```

A fact about "user X" belongs in the user's service/repository, never duplicated into a route or another layer. When adding a new resource (e.g. a new entity), follow this same layer split — don't collapse layers for convenience.

## 9. Where to look before changing something

- **Adding a new business rule?** → goes in `services/`, not `routes/`
- **Adding a new database query?** → goes in `repositories/`, not `services/`
- **Changing what a request/response looks like?** → `schemas/`
- **Changing what's actually stored?** → `models/`, then a new Alembic migration
- **Changing who's allowed to do something?** → `dependencies/roles.py` (role check) or the relevant service (ownership check)

## 10. Full reference documents

For complete detail beyond this quick-reference file, see:
- Vision & Scope document
- Software Requirements Specification (SRS)
- The finalized tech stack decisions document

This file is a summary for fast orientation, not a replacement for those.
