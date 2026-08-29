# VersionVault

**Evidence-first document version control for human and AI-modified documents.**

> What changed? Proof. Who. When. Why it matters.

VersionVault proves what changed in your documents before AI ever explains why it matters. Built with immutable snapshots, cryptographic SHA-256 integrity, deterministic diffing, and grounded AI analysis.

---

## 🏗 Architecture & Stack

| Layer | Technology |
|-------|-----------|
| Fullstack / App | Next.js 16 (App Router) + React 19 + TypeScript |
| UI & Styling | Tailwind CSS + Lucide React + Framer Motion |
| Database & Auth | Supabase (PostgreSQL + RLS + Private Storage) |
| AI Gateway | OpenRouter (Model agnostic) |
| Engine & Audit | SHA-256 Content & Version chaining + Deterministic Diff |

---

## 📁 Project Structure

```
src/
├── app/              # Next.js App Router routes & API endpoints
├── components/       # Reusable UI components (DiffViewer, EvidencePanel, etc.)
├── views/            # Workspace view pages
├── engine/           # Deterministic diffing, materiality classification & provenance
├── ai/               # AI gateway, proposals, explanation & history Q&A
├── services/         # Business logic services (auth, document, version, branch, etc.)
├── types/            # Canonical domain models, contracts, and frontend types
├── data/             # Mock data & fixtures
├── lib/              # Client utilities & Supabase client singletons
└── utils/            # Helper utilities
```

---

## 🚀 Getting Started

### 1. Configure Environment Variables
Copy `.env.example` to `.env.local` and supply your credentials:
```bash
cp .env.example .env.local
```

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
# Next.js App & API routes
npm run dev

# Vite Client UI
npm run dev:vite
```
Open [http://localhost:3000](http://localhost:3000) or [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Run Tests & Demos
```bash
# Run unit tests
npm test

# Run Golden Demo script
npm run demo
```

---

## 🌿 Branches

| Branch | Purpose |
|--------|---------|
| `main` | Stable, production-ready code |
| `dev` | Active development — merge PRs here first |

All feature branches should be cut from `dev` and merged back via pull request.

---

## 🛡 Security & Design Principles

- **Evidence first** — deterministic change data is always more prominent than AI interpretation.
- **Strict multi-tenancy** — Row Level Security (RLS) on all Supabase tables.
- **Append-only integrity** — document versions and activity events are immutable once marked `READY`.
- **Never fake AI** — explicit states (`PROCESSING`, `AVAILABLE`, `UNAVAILABLE`, `FAILED`) are surfaced transparently.
