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

CREATE TYPE application_status_enum AS ENUM (
    'pending',
    'reviewed',
    'shortlisted',
    'accepted',
    'rejected'
);

CREATE TABLE admins (
    admin_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

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

-- PART 2: INDEXES

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

CREATE INDEX idx_applications_user_id
    ON applications (user_id);

CREATE INDEX idx_applications_job_id
    ON applications (job_id);

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


CREATE INDEX idx_job_skills_skill_id
    ON job_skills (skill_id);

CREATE INDEX idx_user_skills_skill_id
    ON user_skills (skill_id);

CREATE INDEX idx_jobs_active
    ON jobs (job_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_applications_active
    ON applications (application_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_companies_active
    ON companies (company_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_users_active
    ON users (user_id) WHERE deleted_at IS NULL;

-- PART 3: TRANSACTIONS ON AUDIT COLUMNS

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




