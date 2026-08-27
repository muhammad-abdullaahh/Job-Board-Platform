-- -----------------------------------------------------------------------------
-- PART 1: ENUM TYPES
-- -----------------------------------------------------------------------------

CREATE TYPE employment_type_enum AS ENUM (
    'full_time',
    'part_time',
    'contract',
    'remote',
    'internship'
);

CREATE TYPE job_status_enum AS ENUM (
    'open',
    'closed',
    'draft'
);

CREATE TYPE application_status_enum AS ENUM (
    'pending',
    'reviewed',
    'shortlisted',
    'offer_issued',
    'offer_accepted',
    'offer_declined',
    'hired',
    'rejected',
    'expired'
);

-- -----------------------------------------------------------------------------
-- PART 2: TABLES
-- -----------------------------------------------------------------------------

-- 1. USERS (Unified model — is_admin = TRUE means admin)
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    bio TEXT,
    years_experience INT NOT NULL DEFAULT 0
        CHECK (years_experience >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    deleted_by INT,

    CONSTRAINT fk_users_deleted_by
        FOREIGN KEY (deleted_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

-- 2. COMPANIES
CREATE TABLE companies (
    company_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    website VARCHAR(255),
    location VARCHAR(255),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    updated_by INT,
    deleted_at TIMESTAMPTZ,
    deleted_by INT,

    CONSTRAINT fk_companies_verified_by
        FOREIGN KEY (verified_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_companies_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_companies_deleted_by
        FOREIGN KEY (deleted_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

-- 3. SKILLS
CREATE TABLE skills (
    skill_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by INT,
    updated_at TIMESTAMPTZ,

    CONSTRAINT fk_skills_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

-- 4. JOBS
CREATE TABLE jobs (
    job_id SERIAL PRIMARY KEY,
    company_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255),
    salary_min INT
        CHECK (salary_min IS NULL OR salary_min >= 0),
    salary_max INT
        CHECK (salary_max IS NULL OR salary_min IS NULL OR salary_max >= salary_min),
    employment_type employment_type_enum NOT NULL DEFAULT 'full_time',
    status job_status_enum NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by INT,
    updated_at TIMESTAMPTZ,
    updated_by INT,
    deleted_at TIMESTAMPTZ,
    deleted_by INT,

    CONSTRAINT fk_jobs_company
        FOREIGN KEY (company_id)
        REFERENCES companies(company_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_jobs_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_jobs_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_jobs_deleted_by
        FOREIGN KEY (deleted_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

-- 5. APPLICATIONS
CREATE TABLE applications (
    application_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    job_id INT NOT NULL,
    cover_letter TEXT NOT NULL,
    status application_status_enum NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by INT,
    updated_at TIMESTAMPTZ,
    updated_by INT,
    offer_issued_at TIMESTAMPTZ,
    offer_expires_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_applications_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_applications_job
        FOREIGN KEY (job_id)
        REFERENCES jobs(job_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_applications_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_applications_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT uq_user_job
        UNIQUE (user_id, job_id)
);

-- 6. USER_SKILLS (Junction Table)
CREATE TABLE user_skills (
    user_id INT NOT NULL,
    skill_id INT NOT NULL,

    PRIMARY KEY (user_id, skill_id),

    CONSTRAINT fk_user_skills_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_user_skills_skill
        FOREIGN KEY (skill_id)
        REFERENCES skills(skill_id)
        ON DELETE CASCADE
);

-- 7. JOB_SKILLS (Junction Table)
CREATE TABLE job_skills (
    job_id INT NOT NULL,
    skill_id INT NOT NULL,

    PRIMARY KEY (job_id, skill_id),

    CONSTRAINT fk_job_skills_job
        FOREIGN KEY (job_id)
        REFERENCES jobs(job_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_job_skills_skill
        FOREIGN KEY (skill_id)
        REFERENCES skills(skill_id)
        ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- PART 3: INDEXES
-- -----------------------------------------------------------------------------

CREATE INDEX idx_users_email
    ON users (email);

CREATE INDEX idx_jobs_title
    ON jobs (title);

CREATE INDEX idx_jobs_status_location
    ON jobs (status, location);

CREATE INDEX idx_jobs_location
    ON jobs (location);

CREATE INDEX idx_jobs_employment_type
    ON jobs (employment_type);

CREATE INDEX idx_jobs_salary_range
    ON jobs (salary_min, salary_max);

CREATE INDEX idx_jobs_company_id
    ON jobs (company_id);

CREATE INDEX idx_jobs_created_by
    ON jobs (created_by);

CREATE INDEX idx_jobs_updated_by
    ON jobs (updated_by);

CREATE INDEX idx_jobs_deleted_by
    ON jobs (deleted_by);

CREATE INDEX idx_applications_user_id
    ON applications (user_id);

CREATE INDEX idx_applications_job_id
    ON applications (job_id);

CREATE INDEX idx_applications_created_by
    ON applications (created_by);

CREATE INDEX idx_applications_updated_by
    ON applications (updated_by);

CREATE INDEX idx_companies_verified_by
    ON companies (verified_by);

CREATE INDEX idx_companies_updated_by
    ON companies (updated_by);

CREATE INDEX idx_companies_deleted_by
    ON companies (deleted_by);

CREATE INDEX idx_users_deleted_by
    ON users (deleted_by);

CREATE INDEX idx_skills_created_by
    ON skills (created_by);

CREATE INDEX idx_job_skills_skill_id
    ON job_skills (skill_id);

CREATE INDEX idx_user_skills_skill_id
    ON user_skills (skill_id);

-- Partial Indexes for Active Records
CREATE INDEX idx_jobs_active
    ON jobs (job_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_applications_active
    ON applications (application_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_companies_active
    ON companies (company_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_users_active
    ON users (user_id) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- PART 4: TRIGGERS FOR AUDIT COLUMNS
-- -----------------------------------------------------------------------------

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
