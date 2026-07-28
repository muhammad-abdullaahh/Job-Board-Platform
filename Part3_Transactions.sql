-- =========================================================
-- PART 3: TRANSACTIONS ON AUDIT COLUMNS
-- Everything below assumes Parts 1 and 2 have already been run.
-- =========================================================
-- WHY THIS PART EXISTS:
--   created_at / updated_at / deleted_at / created_by / updated_by /
--   deleted_by are audit columns. They only stay trustworthy if
--   every write that touches them is ATOMIC — i.e., either every
--   part of the change (the actual data change + who did it + when)
--   commits together, or none of it does.
--
--   Two techniques are used together here:
--     1. TRIGGERS auto-populate updated_at on every UPDATE, so
--        application code can never forget to set it or set it
--        incorrectly — this removes human error from one half of
--        the audit trail.
--     2. Explicit TRANSACTIONS (BEGIN...COMMIT) wrap any operation
--        where MULTIPLE related facts must be written together
--        (e.g., "mark company verified" + "record which admin
--        verified it" + "log the action") — if any statement in
--        the block fails, ROLLBACK undoes all of it, so you never
--        end up with is_verified = TRUE but verified_by = NULL, or
--        similar half-committed inconsistent state.
--
-- Only tables that actually HAVE the relevant audit column get a
-- trigger/transaction for it — admins (created_at only) and skills
-- (created_at, created_by, updated_at — no deleted_at in the final
-- ERD) are handled accordingly, not padded with columns they don't
-- have.
-- =========================================================


-- ---------------------------------------------------------
-- 3.1 — GENERIC TRIGGER FUNCTION: auto-set updated_at
-- One reusable function, attached to every table that has an
-- updated_at column, so "forgot to update the timestamp" becomes
-- structurally impossible rather than a code-review concern.
-- ---------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_skills_updated_at
    BEFORE UPDATE ON skills
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();


-- ---------------------------------------------------------
-- 3.2 — COMPANIES: verify a company (created_at is set once at
-- INSERT time and never touched again; this transaction covers
-- verified_by + is_verified + updated_by together, since a
-- verification event should never partially apply).
-- ---------------------------------------------------------

BEGIN;

    UPDATE companies
    SET is_verified = TRUE,
        verified_by = 3,        -- example admin_id performing verification
        updated_by  = 3         -- same admin is recorded as the modifier
    WHERE company_id = 10;
    -- updated_at is set automatically by trg_companies_updated_at

COMMIT;

-- Soft-delete a company (deleted_at + deleted_by must land together —
-- a company row can never be "half deleted" with only one set).
BEGIN;

    UPDATE companies
    SET deleted_at = NOW(),
        deleted_by = 3           -- admin performing the removal
    WHERE company_id = 10;

COMMIT;


-- ---------------------------------------------------------
-- 3.3 — USERS: soft-delete (moderation action by an admin).
-- deleted_at and deleted_by are always written in the same
-- statement/transaction — there is no valid state where a user
-- is "deleted" but the responsible admin is unrecorded.
-- ---------------------------------------------------------

BEGIN;

    UPDATE users
    SET deleted_at = NOW(),
        deleted_by = 3           -- admin_id performing the moderation
    WHERE user_id = 45;

COMMIT;


-- ---------------------------------------------------------
-- 3.4 — SKILLS: create a new curated skill.
-- created_at and created_by must land together — a skill row
-- with no known creator would break the "controlled vocabulary,
-- curated by admins" rule (Domain Requirement #3).
-- ---------------------------------------------------------

BEGIN;

    INSERT INTO skills (name, created_by)
    VALUES ('Kubernetes', 3);   -- created_at defaults to NOW() automatically

COMMIT;


-- ---------------------------------------------------------
-- 3.5 — JOBS: post a job, then later update its status.
-- created_at/company_id are set atomically at INSERT.
-- updated_by is set together with the actual status change —
-- never leave a status flip recorded without knowing who did it.
-- ---------------------------------------------------------

BEGIN;

    INSERT INTO jobs (company_id, title, description, location,
                       salary_min, salary_max, employment_type)
    VALUES (10, 'Backend Engineer', 'Build and maintain APIs',
            'Karachi', 80000, 150000, 'full_time');

COMMIT;

-- Later: a user (acting on behalf of the company) closes the job.
BEGIN;

    UPDATE jobs
    SET status = 'closed',
        updated_by = 45          -- user_id performing the status change
    WHERE job_id = 20;
    -- updated_at is set automatically by trg_jobs_updated_at

COMMIT;

-- Soft-delete a job — deleted_at and deleted_by must commit together.
BEGIN;

    UPDATE jobs
    SET deleted_at = NOW(),
        deleted_by = 45
    WHERE job_id = 20;

COMMIT;


-- ---------------------------------------------------------
-- 3.6 — APPLICATIONS: submit an application, then update status.
-- This is the clearest case for why transactions matter: the
-- UNIQUE(user_id, job_id) constraint means a duplicate application
-- attempt will throw an error mid-transaction — wrapping the
-- insert in a transaction means a failed attempt cleanly rolls
-- back rather than leaving partial state.
-- ---------------------------------------------------------

BEGIN;

    INSERT INTO applications (user_id, job_id, cover_letter)
    VALUES (45, 20, 'I would love to work on this backend role...');
    -- created_at defaults to NOW(); status defaults to 'pending'

COMMIT;

-- Reviewer (a user acting for the company) updates application status.
-- status + updated_by must always change together — an application
-- moving to 'shortlisted' with no recorded reviewer is not allowed.
BEGIN;

    UPDATE applications
    SET status = 'shortlisted',
        updated_by = 12           -- user_id of the reviewer
    WHERE application_id = 100;
    -- updated_at is set automatically by trg_applications_updated_at

COMMIT;

-- Soft-delete (withdraw) an application.
BEGIN;

    UPDATE applications
    SET deleted_at = NOW()
    WHERE application_id = 100;

COMMIT;


-- ---------------------------------------------------------
-- 3.7 — WHY ROLLBACK MATTERS HERE (illustrative example)
-- If a transaction attempts to both verify a company AND log an
-- inconsistent admin_id that doesn't exist, the FK constraint on
-- verified_by fails — and because it's wrapped in a transaction,
-- NOTHING from this block is committed, not even the parts that
-- would have otherwise succeeded.
-- ---------------------------------------------------------

BEGIN;

    UPDATE companies
    SET is_verified = TRUE,
        verified_by = 9999      -- assume this admin_id does not exist
    WHERE company_id = 11;
    -- This statement fails on the FK constraint fk_companies_verified_by.
    -- Because the whole block is one transaction, is_verified never
    -- silently becomes TRUE without a valid verifier attached.

ROLLBACK;
