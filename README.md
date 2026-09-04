# CRM Monorepo

This repository contains the CRM frontend and backend in one project.

<h2>CRM For IT Services: <a href="https://crm-frontend.fleet.binihost.com/login" target="_blank">
  <u>Live Server</u>
</a></h2>

## Structure

- `backend/` — FastAPI API
- `frontend/` — Next.js application
- `.github/workflows/` — independent backend and frontend image workflows
- `compose.yaml` — local backend and frontend stack using an external database

## Local setup

1. Copy `.env.example` to `.env`, set the external `DATABASE_URL`, and replace
   the placeholder secrets.
2. Start the complete stack:

   ```bash
   docker compose up --build
   ```

3. Open the frontend at <http://localhost:3000> and the backend API at <http://localhost:8000>.

Stop the stack with `docker compose down`.

## CI/CD

- Changes under `backend/` run `.github/workflows/backend.yml`.
- Changes under `frontend/` run `.github/workflows/frontend.yml`.
- Each workflow can also be started manually from GitHub Actions.
