# AGENTS.md

Guidance for AI coding agents working in this repository. Human contributors should read it too.

**inkydoop** is an AI-powered daily ELA (English Language Arts) web app for elementary students (grades 3–5). The full product and technical design lives in [README.md](README.md) — treat it as the source of truth. Section references below (e.g. §6.1) point into it.

## Prime directive: YAGNI + clean, minimal code

- **Build only what the current task needs.** No speculative abstractions, options, config flags, or "future-proofing." If it isn't used now, don't write it.
- **Prefer deleting over adding.** The best change is often less code.
- **No premature abstraction.** Don't create a helper, wrapper, or interface for a single call site. Wait for the third use.
- **No dead code, no commented-out code, no TODO graveyards.** Remove it; git remembers.
- **Small, focused modules.** One responsibility per file. Keep functions short and named for intent.
- **Don't add error handling for impossible states.** Validate only at real boundaries (I/O, LLM output, request input).
- **Match existing patterns.** Consistency beats cleverness.
- **No comments that restate the code.** Comment only non-obvious *why*, never the *what*.

If a task tempts you to add something "just in case," stop and leave it out.

## Architecture (see README for detail)

- **Single deployable, single language — TypeScript end-to-end** (UI + API + schemas). Go/C# were considered and rejected to avoid a two-language system (§5.2).
- **Next.js (App Router)** serves the React UI and the API route handlers.
- **Content is generated once per day** and cached; reads never call an LLM (§6). Generation happens **only** via the key-protected `POST /api/generate` (§6.2).
- **Storage:** Azure **Table** Storage for the daily JSON pack, Azure **Blob** Storage for story images. Dev uses the **Azurite** emulator for both (§5.4).
- **AI:** OpenRouter for text, a dedicated image API for illustrations (§6.1).
- **Zod schemas are the single source of truth** for types and runtime validation across UI and API (§7). Every LLM and request/response boundary is Zod-validated.

## Build and test

The app is not scaffolded yet. Follow the execution plan in README §14, starting at **M0 (T0.1)**. Once scaffolded, the package scripts are the canonical commands:

- `pnpm dev` — run the app locally
- `pnpm dev:storage` — start the Azurite emulator (Table + Blob)
- `pnpm lint` — ESLint
- `pnpm test` — Vitest unit tests
- `pnpm test:e2e` — Playwright end-to-end
- `pnpm build` — production build (`output: 'standalone'`)

Keep this list in sync with `package.json` as scripts are added. Do not invent commands that don't exist.

## Conventions

- **Package manager:** pnpm. **Runtime:** Node 22.
- **Next.js 16 (App Router).** APIs differ from older majors (e.g. async request APIs); verify against the installed version's bundled docs rather than assuming older-Next patterns. `CLAUDE.md` intentionally just points to this file.
- **Validation:** define/extend Zod schemas in one place (`src/lib/schemas.ts`) and infer types from them — never hand-maintain a parallel `type`.
- **Secrets:** never commit, log, or expose to the client bundle. Server-only env vars are **not** prefixed `NEXT_PUBLIC_`. `GENERATE_API_KEY`, `OPENROUTER_API_KEY`, and `IMAGE_API_KEY` are secrets (§11).
- **Env access goes through the validated `src/lib/env.ts`**, not raw `process.env` scattered across the code.
- **Tests live next to the code** they cover (`*.test.ts`). Add a test with each unit of logic, not after.
- **Follow the task IDs** in README §14 (`T{milestone}.{n}`); keep each change scoped to one task and its acceptance check.

## Safety (non-negotiable — it's a kids' app)

- Content guardrails and a post-generation moderation pass gate everything before it's cached (§8).
- **Student input is untrusted:** the grading Guard agent detects injection and wraps answers in `<student_answer>` tags (§6.5).
- **Generated images are moderated** before upload; `alt` text is mandatory (§8).

## When in doubt

Prefer the smallest change that satisfies the task and its acceptance check in README §14. Ask before introducing a new dependency, a new abstraction layer, or anything not called for by the current task.
