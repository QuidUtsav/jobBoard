# JobBoard

A full-stack job board connecting **hirers** (who post jobs) and **freelancers** (who apply to them). Built as a FastAPI + PostgreSQL backend with a React (Vite) frontend.

**Live:**
- Frontend: https://job-board-rho-seven.vercel.app
- Backend API: https://jobboard-o45t.onrender.com
- API docs (Swagger): https://jobboard-o45t.onrender.com/docs

---

## Stack

| Layer | Technology |
|---|---|
| Backend framework | FastAPI |
| ORM / migrations | SQLAlchemy + Alembic |
| Database | PostgreSQL (Neon in production, local Postgres in dev) |
| Auth | JWT (python-jose) + bcrypt password hashing |
| Frontend | React 19 (Vite), React Router |
| Hosting | Render (backend), Vercel (frontend), Neon (database) |

---

## Architecture

```
┌─────────────────┐        HTTPS / JSON        ┌──────────────────┐        SQL         ┌────────────┐
│  React frontend  │ ─────────────────────────▶ │  FastAPI backend  │ ─────────────────▶ │  Postgres   │
│  (Vercel)         │ ◀───────────────────────── │  (Render)          │ ◀───────────────── │  (Neon)      │
└─────────────────┘      JWT in Authorization    └──────────────────┘                    └────────────┘
                          header, per request
```

The frontend holds no server-side state of its own — it authenticates via a JWT stored in `localStorage`, attached to every request as `Authorization: Bearer <token>`. The backend is stateless between requests; each one independently verifies the token and opens a fresh DB session.

---

## Data model

Three tables, two of which are linked through a **junction table** (`applications`) representing a many-to-many relationship between accounts and posts.

```
accounts                    posts                        applications
─────────                   ─────                         ────────────
id (PK)                     id (PK)                        id (PK)
name                        title                          content
email (unique)              content                        created_at
hashed_password              created_at                     post_id (FK → posts.id)
role: freelancer | hirer     author_id (FK → accounts.id)   user_id (FK → accounts.id)
                              expiry_date                    UNIQUE(post_id, user_id)
```

**Design notes:**
- `accounts.role` gates behavior throughout the API — a `hirer` can post jobs, a `freelancer` can apply. No separate role tables; normalization is preserved by deriving counts (e.g. "how many applied") via `COUNT()` queries rather than storing them.
- `applications` is the many-to-many junction between `accounts` and `posts`. The composite `UNIQUE(post_id, user_id)` constraint enforces "one application per freelancer per job" at the database level — the API also catches the resulting `IntegrityError` and returns a clean `409` instead of a raw 500.
- Migrations are managed by Alembic; the current baseline migration (`initial schema`) creates all three tables from scratch, so it can run cleanly against any empty Postgres instance (local or Neon).

---

## API reference

Base URL: `https://jobboard-o45t.onrender.com` (or `http://localhost:8000` locally)

### Auth

| Method | Path | Auth required | Description |
|---|---|---|---|
| POST | `/signup` | No | Create an account. Body: `{ name, email, password, role }`, `role` must be `"freelancer"` or `"hirer"`. |
| POST | `/login` | No | Form-encoded (`username`=email, `password`). Returns `{ access_token, token_type, acc_type }`. |
| GET | `/me` | Yes | Returns the logged-in account's own details. |

### Accounts

| Method | Path | Auth required | Description |
|---|---|---|---|
| GET | `/accounts` | Yes | Lists all accounts (name + role only — no email/password exposed). |

### Posts (jobs)

| Method | Path | Auth required | Description |
|---|---|---|---|
| GET | `/posts` | No | List all job posts. |
| POST | `/posts` | Yes (hirer) | Create a job post. Body: `{ title, content }`. |
| PUT | `/post/{post_id}` | Yes (owner) | Edit a job post you posted. |
| DELETE | `/post/{post_id}` | Yes (owner) | Delete a job post (cascades — also deletes its applications). |

### Applications

| Method | Path | Auth required | Description |
|---|---|---|---|
| POST | `/application` | Yes (freelancer) | Apply to a post. Body: `{ post_id, content }` (cover letter). Blocked if the post is expired or you've already applied. |
| GET | `/post/{post_id}/applications` | Yes (post owner) | List applicants to a specific job — only visible to the hirer who posted it. |
| GET | `/application/{user_id}` | Yes (self only) | List a freelancer's own applications. |
| PUT | `/application/{application_id}` | Yes (owner) | Edit your own application's cover letter. |
| DELETE | `/application/{application_id}` | Yes (owner) | Withdraw your own application. |

All authenticated routes expect `Authorization: Bearer <token>`. Ownership checks return `403` when the caller isn't the resource's owner; `404` when the resource doesn't exist.

---

## Frontend structure

```
src/
├── api.js               — fetch wrapper: base URL, auth header injection, error handling
├── context/
│   └── AuthContext.jsx  — holds the logged-in account, exposes login()/logout(), persists JWT in localStorage
├── components/
│   └── NavBar.jsx       — role-aware nav (Login/Signup vs. Account/Logout)
└── pages/
    ├── JobListing.jsx   — public job feed; "+ Create job post" form for hirers
    ├── PostDetail.jsx   — single job view + apply flow (branches by visitor/freelancer/hirer/expired state)
    ├── Signup.jsx / Login.jsx
    ├── Me.jsx            — private dashboard, branches by role (freelancer: my applications / hirer: my posts)
    └── Applicants.jsx    — hirer's view of who applied to one of their posts
```

**Known limitations, not yet built:**
- No `GET /posts/{id}` or "my posts" backend route — the frontend fetches the full post list and filters client-side. Fine at current scale; worth adding dedicated routes if the dataset grows.
- Listings show `author_id` / `user_id` rather than resolved names, since those routes don't join account data in.
- No resume upload — applications are cover-letter text only (a deliberate scope decision, parked for later).

---

## Local setup

### Backend

```bash
cd Backend
python -m venv venv && source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

Create a `.env` file in `Backend/`:
```
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/jobBoard
SECRET_KEY=<a long random hex string — generate with: python -c "import secrets; print(secrets.token_hex(32))">
```

Run migrations, then start the server:
```bash
alembic upgrade head
uvicorn main:app --reload
```
API available at `http://localhost:8000`, docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd jobBoard-frontend
npm install
npm run dev
```
Runs at `http://localhost:5173`. Update `src/api.js`'s `BASE_URL` to `http://localhost:8000` for local development (it currently points at the live Render URL).

**CORS:** the backend's `allow_origins` list (in `main.py`) must include whatever origin the frontend is actually served from — `http://localhost:5173` for local dev, the deployed Vercel URL for production. Mismatches here are the most common cause of "NetworkError" / "CORS Missing Allow Origin" in the browser console.

---

## Deployment notes

- **Database (Neon):** migrations must be run once against the Neon connection string (`alembic upgrade head` with `DATABASE_URL` temporarily pointed at Neon) — Render does not run migrations automatically on deploy.
- **Backend (Render):** Root Directory `Backend`, build command `pip install -r requirements.txt`, start command `uvicorn main:app --host 0.0.0.0 --port $PORT`. Environment variables `DATABASE_URL` and `SECRET_KEY` are set in Render's dashboard, not committed to the repo.
- **Frontend (Vercel):** Root Directory `jobBoard-frontend`, auto-detected as a Vite project. Use the **stable production domain** shown in Vercel's dashboard (not the per-deploy preview URLs with random hashes) when adding it to the backend's CORS list.

---

## Security notes

- Passwords are hashed with `bcrypt` before storage — never stored or returned in plaintext.
- JWTs are signed with `SECRET_KEY` (HS256) and expire after 30 minutes.
- `.env` (containing `DATABASE_URL` and `SECRET_KEY`) is gitignored and must never be committed.
- If either credential is ever exposed (e.g. pasted somewhere public), rotate it immediately — regenerate `SECRET_KEY` and reset the database password in Neon's dashboard.