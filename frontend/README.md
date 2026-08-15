# CRM Frontend

The CRM web application is built with Next.js and TypeScript.

## Development

From this directory:

```bash
cp .env.example .env.local
npm install
npm run dev
```

The application is available at <http://localhost:3000>. Configure
`NEXT_PUBLIC_API_BASE_URL` to point to the backend API.

For the complete frontend and backend stack, use Docker Compose from the
repository root as described in the root `README.md`.
