# VersionVault

Evidence-first document version control for human and AI-modified documents.

VersionVault proves what changed in a document before AI explains why it matters. It combines immutable snapshots, SHA-256 integrity, deterministic diffing, provenance/blame, RBAC, audit logs, and graceful AI fallback behavior.

## Current Demo Path

Recommended hackathon path:

- Use the Vite UI for the polished demo surface.
- Use the Next.js app/API as the full-stack backend credibility layer.
- Keep deterministic diff/provenance/security as the source of truth; AI is secondary and may be unavailable.

## Stack

| Layer | Technology |
| --- | --- |
| Full-stack app/API | Next.js 16 App Router, React 19, TypeScript |
| Demo UI | Vite, React Router, Tailwind CSS, Lucide React, Framer Motion |
| Database/auth/storage | Supabase PostgreSQL, Auth, private Storage |
| AI gateway | OpenRouter |
| Core engine | SHA-256 hashing, parent hash chaining, deterministic diff, materiality, provenance |
| Tests | Vitest |

## Project Structure

```text
src/
  app/          Next.js pages and API route handlers
  api/          Express demo router
  ai/           AI gateway, explanations, proposals, history Q&A
  components/   Shared React UI components
  data/         Mock/demo document data
  demo/         Golden demo script
  engine/       Normalization, diff, materiality, provenance
  lib/          Config, validation, Supabase clients, hashing
  services/     Auth, documents, versions, branches, collaborators, activity
  types/        Domain, API, and engine contracts
  utils/        UI/demo helpers
tests/          Vitest unit tests
supabase/       Database migrations
```

## Prerequisites

- Node.js 20 or newer
- npm
- Supabase project, if using real auth/database/storage
- OpenRouter API key, if using live AI responses

On Windows PowerShell, prefer `npm.cmd` because `npm.ps1` may be blocked by execution policy.

## Install

```bash
npm install
```

## Environment

Copy the template and fill in real values when using external services:

```bash
cp .env.example .env.local
```

On PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Required for the Next.js app/API with Supabase:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Optional for AI:

```env
OPENROUTER_API_KEY=
OPENROUTER_MODEL=meta-llama/llama-3.1-70b-instruct
```

Optional and currently only needed if queue/workers are introduced:

```env
REDIS_URL=
```

Optional and only needed if Google OAuth is enabled in the product:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Never commit `.env.local` or real service keys.

## External Services

### Supabase

Used for:

- User auth and sessions
- Tenants and memberships
- Documents, versions, branches, collaborators
- Structured changes, processing jobs, AI explanation/proposal records
- Append-only activity events
- Private document storage

Setup:

1. Create a Supabase project.
2. Copy the project URL and anon key into `.env.local`.
3. Copy the service role key into `SUPABASE_SERVICE_ROLE_KEY`.
4. Apply the migration in `supabase/migrations/001_initial_schema.sql`.
5. Ensure the private storage bucket expected by the backend exists. The current services use the `documents` bucket.

Security note: `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and must only be used server-side. The service layer includes explicit authorization guards for service-role reads/writes.

### OpenRouter

Used for:

- AI explanations of deterministic diffs
- History Q&A
- AI proposal flows

Setup:

1. Create an OpenRouter key at `https://openrouter.ai/keys`.
2. Set `OPENROUTER_API_KEY`.
3. Set `OPENROUTER_MODEL`, or use the default model above.

If `OPENROUTER_API_KEY` is missing or the network call fails, the app returns an explicit unavailable state. Deterministic diff and provenance continue to work.

### Redis

`REDIS_URL` is optional. It is present in the environment template for future queue/worker work, but the current verified commands do not require Redis.

### Google OAuth

Google OAuth variables are optional placeholders. Do not add them unless OAuth is enabled in Supabase/Auth settings and the app flow is wired for it.

## Run Locally

### Next.js app and API

```bash
npm.cmd run dev
```

Open:

```text
http://localhost:3000
```

### Vite demo UI

```bash
npm.cmd run dev:vite
```

Open:

```text
http://localhost:5173
```

If you are not on Windows, `npm run dev` and `npm run dev:vite` are fine.

## Build

### Next.js production build

```bash
npm.cmd run build
```

### Vite production build

```bash
npm.cmd run build:vite
```

The Vite build outputs to `dist/`.

## Test And Lint

```bash
npm.cmd run type-check
npm.cmd test
npm.cmd run lint
```

Current verified status:

- Type-check passes.
- Unit tests pass.
- Lint passes.
- Next production build passes.
- Vite production build passes.

## Demo Script

For the scripted deterministic engine demo:

```bash
npm.cmd run demo
```

Suggested live demo story:

1. Open the Vite demo UI.
2. Open the Vendor Agreement.
3. Show immutable version history.
4. Compare V17 to V18.
5. Show deterministic changes and materiality first.
6. Show AI explanation as secondary interpretation.
7. Open provenance/blame.
8. Restore or branch from an older version.
9. Show activity/audit trail.
10. Close with security: SHA-256 hashes, parent hash chaining, immutable ready versions, append-only audit, RBAC.

## API Notes

Main Next API surface:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/documents?tenantId=...`
- `POST /api/v1/documents`
- `GET /api/v1/documents/:documentId`
- `PATCH /api/v1/documents/:documentId`
- `GET /api/v1/documents/:documentId/versions`
- `POST /api/v1/documents/:documentId/versions`
- `GET /api/v1/versions/:versionId`
- `GET /api/v1/versions/:versionId/content`
- `POST /api/v1/versions/:versionId/restore`
- `GET /api/v1/versions/:versionId/diff/:targetVersionId`
- `GET /api/v1/versions/:versionId/explanation/:targetVersionId`
- `GET /api/v1/documents/:documentId/branches`
- `POST /api/v1/documents/:documentId/branches`
- `GET /api/v1/documents/:documentId/collaborators`
- `POST /api/v1/documents/:documentId/collaborators`
- `DELETE /api/v1/documents/:documentId/collaborators/:userId`
- `GET /api/v1/documents/:documentId/activity`
- `GET /api/v1/documents/:documentId/blame`
- `GET /api/v1/documents/:documentId/graph`
- `POST /api/v1/documents/:documentId/qa`
- `GET /api/v1/documents/:documentId/proposals`
- `POST /api/v1/documents/:documentId/proposals`
- `GET /api/v1/proposals/:proposalId`
- `POST /api/v1/proposals/:proposalId`

## Security Principles

- Evidence-first: deterministic change data is primary.
- AI is never the source of truth.
- Service-role Supabase calls must be guarded in application code.
- Viewer write access is blocked.
- Contributor collaborator management is blocked.
- `READY` versions are intended to be immutable.
- Activity events are append-only.
- Signed URLs should be short-lived.
- Errors should avoid leaking cross-tenant resource existence.
