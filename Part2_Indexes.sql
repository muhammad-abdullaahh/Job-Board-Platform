-- =========================================================
-- PART 2: INDEXES
-- Everything below assumes Part 1 has already been run.
-- =========================================================
-- Reminder on the underlying theory (covered earlier):
--   - Postgres auto-indexes PRIMARY KEY and UNIQUE columns only.
--     It does NOT auto-index foreign key columns — those must be
--     created manually or relational lookups become full table
--     scans.
--   - A composite index is only usable, left to right, as a
--     CONTIGUOUS PREFIX (the "leftmost-prefix rule"). Order the
--     columns based on which query patterns actually run.
-- =========================================================

-- ---------------------------------------------------------
-- Lookups by unique fields
-- ---------------------------------------------------------
-- users.email, companies handled implicitly:
-- users.email, admins.email, skills.name already have an
-- automatic index because they're declared UNIQUE above.
-- No additional index needed for "look up by email on login."

-- ---------------------------------------------------------
-- Search and filtering (jobs table)
-- ---------------------------------------------------------

-- Composite index: covers "filter by status" alone (status is the
-- leftmost column) AND the common combo query "open jobs in a
-- given location" in a single index traversal.
CREATE INDEX idx_jobs_status_location
    ON jobs (status, location);

-- Standalone index: location is one of the most frequent filters
-- per the SRS and is not always paired with status — the composite
-- above only serves location when status is also present, per the
-- leftmost-prefix rule, so a dedicated index is added here too.
CREATE INDEX idx_jobs_location
    ON jobs (location);

-- Single-column index: employment_type is filtered independently.
CREATE INDEX idx_jobs_employment_type
    ON jobs (employment_type);

-- Composite index: salary_min and salary_max are checked together
-- for range queries ("salary between X and Y"). Note: Postgres can
-- only apply an efficient index-level range scan on the FIRST
-- column (salary_min); salary_max is then rechecked as a row filter
-- on the matches found — still far better than a full scan, but not
-- "both columns range-narrowed independently."
CREATE INDEX idx_jobs_salary_range
    ON jobs (salary_min, salary_max);

-- ---------------------------------------------------------
-- Relational lookups (foreign keys)
-- Postgres does NOT auto-index FK columns — these must be
-- created manually.
-- ---------------------------------------------------------

CREATE INDEX idx_jobs_company_id
    ON jobs (company_id);

CREATE INDEX idx_applications_user_id
    ON applications (user_id);

CREATE INDEX idx_applications_job_id
    ON applications (job_id);

-- Audit/governance FK columns — needed for admin dashboards and
-- moderation queries ("show everything this admin has touched").
CREATE INDEX idx_companies_verified_by
    ON companies (verified_by);

CREATE INDEX idx_companies_updated_by
    ON companies (updated_by);

CREATE INDEX idx_companies_deleted_by
    ON companies (deleted_by);

CREATE INDEX idx_users_deleted_by
    ON users (deleted_by);

CREATE INDEX idx_jobs_updated_by
    ON jobs (updated_by);

CREATE INDEX idx_jobs_deleted_by
    ON jobs (deleted_by);

CREATE INDEX idx_applications_updated_by
    ON applications (updated_by);

CREATE INDEX idx_skills_created_by
    ON skills (created_by);

-- ---------------------------------------------------------
-- Skill matching
-- The composite primary keys on job_skills (job_id, skill_id) and
-- user_skills (user_id, skill_id) already index job_id / user_id
-- for free as the leftmost column — but NOT skill_id efficiently
-- when searched on its own. Each table needs its own skill_id index.
-- ---------------------------------------------------------

CREATE INDEX idx_job_skills_skill_id
    ON job_skills (skill_id);

CREATE INDEX idx_user_skills_skill_id
    ON user_skills (skill_id);

-- ---------------------------------------------------------
-- Soft-delete filtering
-- Almost every real query on jobs/applications/companies/users
-- will implicitly filter "WHERE deleted_at IS NULL" to exclude
-- soft-deleted rows. A partial index keeps this fast and small,
-- since it only indexes the (common case) live rows.
-- ---------------------------------------------------------

CREATE INDEX idx_jobs_active
    ON jobs (job_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_applications_active
    ON applications (application_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_companies_active
    ON companies (company_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_users_active
    ON users (user_id) WHERE deleted_at IS NULL;
