<<<<<<< HEAD
# VersionVault

**Evidence-first document version control for human and AI-modified documents.**

VersionVault proves what changed in your documents before AI ever explains why it matters. Built with immutable snapshots, cryptographic SHA-256 integrity, deterministic diffing, and grounded AI analysis.

---

## 🏗 Architecture & Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4
- **Auth, Database & Storage**: Supabase (PostgreSQL + RLS + Private Storage)
- **AI Gateway**: OpenRouter (Model agnostic)
- **Audit & Lineage**: SHA-256 Content & Version chaining

---

## 🚀 Getting Started

### 1. Configure Environment Variables
Copy `.env.example` to `.env.local` and supply your credentials:
=======
# VersionVault — Frontend

> **What changed? Proof. Who. When. Why it matters.**

VersionVault is a document version-control product that gives teams deterministic, tamper-evident evidence of every change — backed by SHA-256 integrity hashes, full provenance tracking, and optional AI interpretation.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite 5 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Routing | React Router v6 |
| Icons | Lucide React |
| Animations | Framer Motion |
| Dates | date-fns |

---

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── AppShell.tsx
│   ├── TopBar.tsx
│   ├── SideNav.tsx
│   ├── DiffViewer.tsx
│   ├── EvidencePanel.tsx
│   ├── AIExplanationPanel.tsx
│   ├── VersionTimeline.tsx
│   ├── VersionInspector.tsx
│   ├── UploadZone.tsx
│   ├── RestoreDialog.tsx
│   ├── ShareDialog.tsx
│   └── ...
├── pages/            # Route-level page components
│   ├── Landing.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── DocumentWorkspace.tsx
│   ├── VersionCompare.tsx
│   ├── Branches.tsx
│   ├── Activity.tsx
│   ├── Settings.tsx
│   └── NotFound.tsx
├── data/             # Mock data (replaced by real API in production)
│   └── documents.ts
├── types/            # Shared TypeScript interfaces and types
│   └── index.ts
├── utils/            # Pure helper functions
│   └── documents.ts
├── App.tsx           # Root router
├── index.tsx         # Entry point
└── index.css         # Global styles + Tailwind imports
```

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Install & Run

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

### Environment Variables

Copy `.env.example` → `.env.local` and fill in the values:
>>>>>>> 390ee37 (feat: implement UI/UX)

```bash
cp .env.example .env.local
```

<<<<<<< HEAD
Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Server-only)
- `OPENROUTER_API_KEY` & `OPENROUTER_MODEL` (Server-only)

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
=======
See [`.env.example`](.env.example) for the full list of variables.

### Build

```bash
npm run build
```

### Type Check

```bash
npm run type-check
```

---

## Branches

| Branch | Purpose |
|--------|---------|
| `main` | Stable, production-ready code |
| `dev` | Active development — merge PRs here first |

All feature branches should be cut from `dev` and merged back via pull request.

---

## Security

The frontend is **never** the authorization layer.

- The app renders only what the authorized API returns.
- `403 / 404` responses are handled without leaking resource existence.
- No service-role keys or private credentials belong in client code.
- See `.env.example` for the expected environment variable pattern.

---

## Key Screens

| Screen | Route |
|--------|-------|
| Landing | `/` |
| Login | `/login` |
| Register | `/register` |
| Dashboard | `/dashboard` |
| Documents | `/documents` |
| Document Workspace | `/documents/:documentId` |
| Version Compare | `/documents/:documentId/compare/:versionId` |
| Branches | `/branches` |
| Activity | `/activity` |
| Settings | `/settings` |

---

## Design Principles

- **Evidence first** — deterministic change data is always more prominent than AI interpretation.
- **Semantic HTML** — accessible by keyboard, screen reader, and reduced-motion preferences.
- **Desktop-first, responsive** — tablet and mobile stack the diff vertically.
- **Never fake AI** — AI states (`PROCESSING`, `AVAILABLE`, `UNAVAILABLE`, `FAILED`) are always explicit.
- **Restore creates a new version** — history is never deleted.
>>>>>>> 390ee37 (feat: implement UI/UX)
