-- =========================================================
-- PART 1: BASE TABLES AND SCHEMA
-- Job Board Platform — PostgreSQL Implementation
-- =========================================================
-- Design notes:
--   - Admins is a SEPARATE entity from Users (not a role flag on
--     users), because an admin is a fundamentally different actor
--     (platform staff, not a job-seeker) with its own identity,
--     credentials, and lifecycle — same reasoning we used to justify
--     Applications as a first-class entity rather than a bare
--     junction table.
--   - Job_Skills and User_Skills remain pure junction tables (no
--     audit columns) because a tag/link row has no independent
--     lifecycle worth auditing — deleting it just means "the tag no
--     longer applies," nothing more.
--   - created_by / updated_by / deleted_by point at whichever actor
--     is actually authorized to perform that action, per the SRS:
--       * Companies -> Admins   (only admins verify/manage companies)
--       * Jobs, Applications -> Users (companies act through a user
--         account in this model; a future "company staff" concept
--         could refine this further)
--       * Skills -> Admins      (skills are a controlled vocabulary,
--         curated by admins, not free text from users/companies)
--       * Users -> Admins       (only admins can moderate/delete a
--         user account)
-- =========================================================

-- ---------------------------------------------------------
-- ENUM TYPES
-- Fixed-value domains enforced at the type level, not via
-- arbitrary strings — this is what satisfies Inverse Requirement #6
-- ("never assign a fixed-set attribute a value outside its enum").
-- ---------------------------------------------------------

CREATE TYPE employment_type_enum AS ENUM (
    'full_time',
    'part_time',
    'contract'
);

CREATE TYPE job_status_enum AS ENUM (
    'open',
    'closed',
    'draft'
);

-- 'accepted' added per SRS Domain Requirement #2, which explicitly
-- requires a terminal "hired" outcome distinct from 'shortlisted'.
CREATE TYPE application_status_enum AS ENUM (
    'pending',
    'reviewed',
    'shortlisted',
    'accepted',
    'rejected'
);

-- ---------------------------------------------------------
-- ADMINS
-- Platform staff. Modeled separately from Users because an admin
-- is not a job-seeker with extra permissions — it's a distinct
-- actor responsible for verifying companies, curating the skills
-- vocabulary, and moderating user accounts (SRS FR3).
-- ---------------------------------------------------------

CREATE TABLE admins (
    admin_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------
-- USERS
-- A person who registers as a job seeker.
-- deleted_by references Admins, since only an admin can moderate
-- / remove a user account per the governance relationships in
-- the final ERD.
-- ---------------------------------------------------------

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    bio TEXT,
    years_of_experience INT NOT NULL DEFAULT 0
        CHECK (years_of_experience >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    deleted_by INT,

    CONSTRAINT fk_users_deleted_by
        FOREIGN KEY (deleted_by)
        REFERENCES admins(admin_id)
        ON DELETE SET NULL
);

-- ---------------------------------------------------------
-- COMPANIES
-- An organisation that registers to post job listings.
-- verified_by / updated_by / deleted_by all reference Admins,
-- since only admins verify and govern companies (SRS FR3).
-- ---------------------------------------------------------

CREATE TABLE companies (
    company_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    website VARCHAR(255),
    location VARCHAR(255),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by INT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    updated_by INT,
    deleted_at TIMESTAMP,
    deleted_by INT,

    CONSTRAINT fk_companies_verified_by
        FOREIGN KEY (verified_by)
        REFERENCES admins(admin_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_companies_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES admins(admin_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_companies_deleted_by
        FOREIGN KEY (deleted_by)
        REFERENCES admins(admin_id)
        ON DELETE SET NULL
);

-- ---------------------------------------------------------
-- SKILLS
-- A predefined, controlled-vocabulary capability tag.
-- UNIQUE on name enforces Domain Requirement #3 ("skills are a
-- controlled vocabulary, not free text") at the storage layer.
-- created_by references Admins, since admins curate the vocabulary.
-- ---------------------------------------------------------

CREATE TABLE skills (
    skill_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by INT,
    updated_at TIMESTAMP,

    CONSTRAINT fk_skills_created_by
        FOREIGN KEY (created_by)
        REFERENCES admins(admin_id)
        ON DELETE SET NULL
);

-- ---------------------------------------------------------
-- JOBS
-- A listing posted by a company. Cannot exist independent of a
-- company (Domain Requirement #4) — company_id is NOT NULL.
-- salary_max >= salary_min enforces Domain Requirement #1 and
-- Inverse Requirement #4.
-- updated_by / deleted_by reference Users, since job status
-- changes are performed by a user acting on behalf of a company
-- in this model (SRS FR5).
-- ---------------------------------------------------------

CREATE TABLE jobs (
    job_id SERIAL PRIMARY KEY,
    company_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    salary_min INT NOT NULL
        CHECK (salary_min >= 0),
    salary_max INT NOT NULL
        CHECK (salary_max >= salary_min),
    employment_type employment_type_enum NOT NULL,
    status job_status_enum NOT NULL DEFAULT 'open',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    updated_by INT,
    deleted_at TIMESTAMP,
    deleted_by INT,

    CONSTRAINT fk_jobs_company
        FOREIGN KEY (company_id)
        REFERENCES companies(company_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_jobs_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_jobs_deleted_by
        FOREIGN KEY (deleted_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

-- ---------------------------------------------------------
-- APPLICATIONS
-- A user's submission to a specific job. Promoted to a first-class
-- entity (not a bare junction table) because it carries its own
-- state and history (cover_letter, status, timestamps) independent
-- of both the user and the job — see prior discussion on
-- associative entities vs. pure junction tables.
-- UNIQUE(user_id, job_id) enforces Inverse Requirement #1
-- ("never allow a user to apply to the same job twice").
-- updated_by references Users, since application status is updated
-- by a user acting on behalf of a company reviewing it (SRS FR6).
-- ---------------------------------------------------------

CREATE TABLE applications (
    application_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    job_id INT NOT NULL,
    cover_letter TEXT NOT NULL,
    status application_status_enum NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    updated_by INT,
    deleted_at TIMESTAMP,

    CONSTRAINT fk_applications_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_applications_job
        FOREIGN KEY (job_id)
        REFERENCES jobs(job_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_applications_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT uq_user_job
        UNIQUE (user_id, job_id)
);

-- ---------------------------------------------------------
-- USER_SKILLS  (pure junction table — no audit columns)
-- Records "this user has this skill." No independent lifecycle;
-- deleting a row simply means the tag no longer applies.
-- ---------------------------------------------------------

CREATE TABLE user_skills (
    user_id INT NOT NULL,
    skill_id INT NOT NULL,

    PRIMARY KEY (user_id, skill_id),

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    FOREIGN KEY (skill_id)
        REFERENCES skills(skill_id)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- JOB_SKILLS  (pure junction table — no audit columns)
-- Records "this job requires this skill." Same reasoning as
-- user_skills above.
-- ---------------------------------------------------------

CREATE TABLE job_skills (
    job_id INT NOT NULL,
    skill_id INT NOT NULL,

    PRIMARY KEY (job_id, skill_id),

    FOREIGN KEY (job_id)
        REFERENCES jobs(job_id)
        ON DELETE CASCADE,

    FOREIGN KEY (skill_id)
        REFERENCES skills(skill_id)
        ON DELETE CASCADE
);
