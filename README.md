# 💼 Job Board Platform

A modern, full-stack, enterprise-grade job recruitment platform built with **FastAPI**, **PostgreSQL**, and **React 18 + Vite**. Designed to connect ambitious talent with forward-thinking employers through a streamlined application workflow, role-based dashboards, and automated recruitment tooling.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Platform-0070F3?style=for-the-badge&logo=vercel&logoColor=white)](https://job-board-platform-frontend-mocha.vercel.app/)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://vitejs.dev/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.10+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20SQLAlchemy-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

---

## 🌐 Live Application

The platform is deployed and fully interactive in production:

> 🚀 **Explore the Live Site:** [https://job-board-platform-frontend-mocha.vercel.app/](https://job-board-platform-frontend-mocha.vercel.app/)

---

## 📑 Architecture & Planning Documents

This repository includes foundational software engineering and database design artifacts:

| Document / Asset | Description | Reference Link |
| :--- | :--- | :--- |
| **Requirements Document** | Preliminary project specification, functional modules, and business logic | [📄 View Requirements](./backend/docs/SRS.docx) \| [📝 View PRD](./backend/docs/prd.md) |
| **Entity-Relationship Diagram (ERD)** | Relational data schema, foreign keys, cardinality, and constraints | [🖼️ View ERD (JPEG)](./backend/docs/ERD.jpeg) |
| **Front-End User Flow** | Visual state diagrams, authentication checkpoints, and route workflows | [🗺️ View Flow Diagram (PNG)](./frontend/docs/Front-end%20flow.png) |
| **Production SQL Schema** | DDL with relational tables, enum definitions, partial indexes, and transactions | [💾 View SQL Schema](./backend/database/Schema.sql) |
| **Architecture & Planning** | Frontend & backend architecture specs and vision documents | [📝 Backend Architecture](./backend/docs/Backend%20Architecture%20Design%20Document.odt) \| [📝 Frontend Architecture](./frontend/docs/Frontend_Architecture_Design_Document.docx) \| [📝 Vision & Scope](./backend/docs/Vision%20and%20Scope%20Document.docx) |

---

## 🌟 Key Features

### 👨‍💼 For Job Seekers
- **Intuitive Job Discovery**: Search listings by keyword, role title, skills, location, employment type (Full-time, Part-time, Remote, Contract, Internship), and salary expectations.
- **Rich Company Profiles**: Explore verified company backgrounds, tech stacks, and active openings.
- **One-Click Applications**: Submit targeted applications with customizable cover letters and resume links.
- **Application Tracking System (ATS)**: Real-time progress updates on submitted applications (`Pending`, `Reviewed`, `Shortlisted`, `Offer Issued`, `Hired`, `Rejected`).
- **Profile & Skill Management**: Curate technical skills, years of experience, bio, and resume details.

### 🏢 For Employers & Recruiters
- **Company Management**: Establish and curate organization profiles with verification requests.
- **Job Posting Lifecycle**: Create, edit, preview, and close job postings with detailed descriptions and required vs. preferred skill tags.
- **Candidate Pipeline Management**: Review applicants, evaluate qualifications, and advance candidates across hiring stages.
- **Soft-Delete Governance**: Maintain data integrity with recoverable job and application records.

### 🛡️ For Platform Administrators
- **Platform Analytics**: High-level platform KPIs including active users, verified companies, live job counts, and hiring funnel conversion rates.
- **Company Verification**: Review and verify company credentials to maintain marketplace authenticity and trust.
- **System Moderation**: Moderate job postings, audit suspicious activity, and manage platform-wide access controls.

---

## ⚙️ Technical Highlights

- **Robust Authentication & Security**:
  - Stateless JSON Web Tokens (JWT) for access and refresh tokens.
  - Secure, HTTP-only, `SameSite=None`, cross-origin cookie storage.
  - Bcrypt password hashing via Passlib.
  - PostgreSQL partial unique index (`users_email_active_unique` on `lower(email) WHERE deleted_at IS NULL`) enabling safe account re-registration while maintaining soft-deleted audit integrity.
- **Automated Background Processing**:
  - Built-in APScheduler running periodic tasks to automatically transition expired job postings to `closed`.
- **Resilient Request Tracing**:
  - Middleware-assigned Correlation IDs (`X-Correlation-ID`) across every incoming HTTP request for end-to-end debugging and audit logging.
- **Standardized Error Handling**:
  - Machine-readable, structured JSON exception responses for HTTP errors, validation issues, and unhandled server faults.
- **Modern Responsive Frontend**:
  - Route-level code splitting using `React.lazy` and `Suspense` for instant page loads.
  - Custom full-page throbber and skeleton states (`LoadingThrobber`).
  - Fluid responsive layouts with collapsible sidebar navigation and modern CSS3 variables.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router DOM v6, Axios, Lucide React, Modern CSS3 |
| **Backend** | FastAPI, Python 3.10+, Pydantic v2, SQLAlchemy 2.0, Alembic, Uvicorn |
| **Database** | PostgreSQL, ACID Transactions, Relational Foreign Keys, Partial Unique Indexes |
| **Security & Auth** | Python-Jose (JWT), Passlib (Bcrypt), HTTP-Only Cookies, CORS Middleware |
| **Automation** | APScheduler (Background job scheduler) |
| **Deployment** | Vercel (Frontend & Serverless API config), Railway (PostgreSQL Database & Backend) |

---

## 📁 Repository Structure

```text
Job-Board-Platform/
├── backend/                        # FastAPI Backend Application & DB Resources
│   ├── alembic/                    # Database migration scripts
│   ├── api/                        # Serverless deployment entrypoints
│   ├── database/                   # Database schemas & seed data
│   │   ├── Schema.sql              # Complete PostgreSQL DDL & constraints
│   │   └── database_exports/       # Pre-seeded CSV database dumps
│   │       ├── users.csv
│   │       ├── companies.csv
│   │       ├── jobs.csv
│   │       ├── skills.csv
│   │       └── applications.csv
│   ├── docs/                       # Backend architecture, ERD, SRS, & PRD
│   │   ├── Backend Architecture Design Document.odt
│   │   ├── ERD.jpeg
│   │   ├── SRS.docx
│   │   ├── Vision and Scope Document.docx
│   │   └── prd.md
│   ├── src/
│   │   └── app/
│   │       ├── core/               # Error handlers, security, & config
│   │       ├── database.py         # SQLAlchemy session & engine
│   │       ├── models/             # Relational ORM models
│   │       ├── routes/             # Auth, Jobs, Companies, Users, Admin
│   │       ├── schemas/            # Pydantic validation schemas
│   │       ├── services/           # Business logic layer
│   │       ├── scheduler.py        # APScheduler job definitions
│   │       └── main.py             # Application entrypoint
│   ├── tests/                      # Unit, integration, & E2E tests
│   ├── requirements.txt            # Python dependencies
│   └── vercel.json                 # Vercel backend config
│
├── frontend/                       # React + Vite Frontend Application
│   ├── docs/                       # Frontend architecture & flow diagrams
│   │   ├── Frontend_Architecture_Design_Document.docx
│   │   └── Front-end flow.png
│   ├── public/                     # Static assets (logos, icons)
│   ├── src/
│   │   ├── api/                    # Axios HTTP client & interceptors
│   │   ├── auth/                   # Context provider & auth hooks
│   │   ├── components/             # UI components (Sidebar, TopHeader, Modal, etc.)
│   │   ├── pages/                  # Application views (Home, Jobs, Dashboard, etc.)
│   │   ├── index.css               # Design tokens & responsive styling
│   │   ├── App.jsx                 # Router & root layout
│   │   └── main.jsx                # DOM entrypoint
│   ├── package.json                # Node.js dependencies & scripts
│   ├── vite.config.js              # Vite build configuration
│   └── vercel.json                 # Vercel frontend config
│
├── docker-compose.yml              # Local multi-container orchestration
├── .gitignore                      # Git ignored files & patterns
└── README.md                       # Project documentation
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- **Node.js**: v18.x or later
- **Python**: v3.10 or later
- **PostgreSQL**: v14.x or later (or a hosted cloud database instance)
- **Git**

---

### 1. Clone the Repository
```bash
git clone https://github.com/muhammad-abdullaahh/Job-Board-Platform.git
cd Job-Board-Platform
```

---

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # On Windows (PowerShell):
   python -m venv venv
   .\venv\Scripts\activate

   # On macOS/Linux:
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   Create a `.env` file in `backend/` based on `.env.example`:
   ```env
   DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/job_board_db
   SECRET_KEY=generate-a-secure-random-secret-key
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=15
   REFRESH_TOKEN_EXPIRE_MINUTES=1440
   ENVIRONMENT=development
   CORS_ORIGINS=http://localhost:5173
   COOKIE_SECURE=false
   COOKIE_SAMESITE=lax
   FRONTEND_URL=http://localhost:5173
   ```

5. Run database migrations or initialize the database:
   ```bash
   # Run the provided SQL script against your database or run Alembic:
   alembic upgrade head
   ```

6. Start the development server:
   ```bash
   python -m uvicorn app.main:app --reload --app-dir src --port 8000
   ```
   *The backend API will be running at `http://127.0.0.1:8000`.*

---

### 3. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Configure frontend environment variables:
   Create a `.env` file in `frontend/`:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

4. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   *The application will be live at `http://localhost:5173`.*

---

## 🚢 Deployment Architecture

- **Frontend**: Deployed on **Vercel** with automatic branch deployments, instant cache invalidation, and custom route rewrites for client-side routing.
- **Backend**: Configured for deployment on **Railway** or **Vercel Serverless**, utilizing connection-pooled PostgreSQL connections and secure HTTPS headers.
- **Database**: Hosted **PostgreSQL** instance with automated backups, partial indexing, and strict relational constraints.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👤 Author

**Muhammad Abdullah**
- GitHub: [@muhammad-abdullaahh](https://github.com/muhammad-abdullaahh)
- Repository: [Job-Board-Platform](https://github.com/muhammad-abdullaahh/Job-Board-Platform)
