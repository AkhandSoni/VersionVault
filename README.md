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
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📚 Project Documentation

The authoritative specifications and contracts are located in the `docs/` folder:
- [`SECURITY.md`](docs/SECURITY.md) — Mandatory security specification & authorization invariants (Takes precedence).
- [`PRD.md`](docs/PRD.md) — Core requirements, domain model, and canonical API endpoints.
- [`PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md) — Architecture, vocabulary, and demo storyline.
- [`UI_UX.md`](docs/UI_UX.md) — UI direction, layout wireframes, and canonical identifiers.
- [`TECH_LEAD_SERVICES.md`](docs/TECH_LEAD_SERVICES.md) — Service credentials, env vars, and infrastructure map.
- Role specifications: `PERSON_1.md` (Backend/Security/Owner), `PERSON_2.md` (Diff/AI), `PERSON_3.md` (Frontend/UI).
