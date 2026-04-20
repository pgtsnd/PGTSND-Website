# Overview

This project is a pnpm workspace monorepo (TypeScript) for **PGTSND
Productions** — a media production company. It powers a public marketing
site, a Client Hub for clients, and a Team Portal for the internal crew
and owners. It streamlines project management, client communication,
asset delivery, video review, and billing.

The vision is an all-in-one platform that runs a media production shop
from lead through delivery: client engagement on one side, internal team
workflow on the other, with deep integrations into the tools the
business already uses (Stripe, Drive, Slack, DocuSign).

For a human-readable catalog of every shipped feature, see
**`FEATURES.md`** in the repo root. Always update both files when you
ship anything user-visible.

# User Preferences

- I want iterative development.
- Ask before making major changes.
- Do not make changes to folder `lib/api-spec`.
- Do not make changes to files with `test` in their name.
- Strict black & white palette in the Client Hub. No other colors. No
  italics anywhere in the Client Hub.
- The sign-in flow is **access-token only** by design. Do not re-add
  Google SSO or magic-link surfaces to the sign-in pages without an
  explicit request.

# System Architecture

## Monorepo Structure
pnpm workspace. Each package owns its dependencies. Notable artifacts:
- `artifacts/api-server` — Express 5 API
- `artifacts/pgtsnd-website` — React + Vite frontend (marketing,
  Client Hub, Team Portal)
- `artifacts/mockup-sandbox` — Vite preview server for component
  mockups on the canvas
- `lib/db` — Drizzle schema + migrations + `@workspace/db` exports
- `lib/api-spec` — OpenAPI spec (do not hand-edit; orval source)

## Technology Stack
- **Node.js** 24, **pnpm**, **TypeScript** 5.9
- **API**: Express 5
- **Database**: PostgreSQL with Drizzle ORM, text UUID PKs
- **Validation**: Zod v4 via `drizzle-zod`
- **API Codegen**: Orval → `@workspace/api-zod` (schemas) and
  `@workspace/api-client-react` (React Query hooks)
- **Build**: esbuild (CJS bundles)
- **Email**: Resend (via `services/email.ts`)
- **Auth**: JWT in HTTP-only cookie (`pgtsnd_session`)

## Database Schema Highlights
- `users` — roles: owner, partner, crew, client.
- `organizations` — client companies.
- `projects` — phase-based lifecycle (pre_production, production,
  post_production, review, delivered).
- `tasks` — project-scoped, with status, assignee, dependencies.
- `deliverables` — outputs with review state.
- `messages` — **either** a project group message (projectId set,
  recipientId null) **or** a DM (projectId null, recipientId set).
- `video_comments` / `video_comment_replies` — timestamped, threaded;
  carry full reopen audit columns (`reopened_at`, `reopened_by`,
  `previous_resolved_*`).
- `access_tokens` — hashed, revocable, with `last_used_at` updated on
  every successful sign-in. JWT carries `tokenId` so revocation is
  effectively immediate.
- `magic_link_tokens` — legacy, route still works but unused by UI.
- `project_notification_mutes` — composite PK on (`user_id`,
  `project_id`); honored by every helper in `services/notifications.ts`.
- `integration_settings` — encrypted blobs per integration.
- `contracts`, `invoices` — DocuSign and Stripe integration fields.

## API Architecture
- All routes mounted under `/api`.
- JWT session cookie + RBAC middleware (owner / partner / crew / client).
- Zod-validated request bodies (drizzle-zod-derived schemas).
- CSRF middleware on mutating routes.
- OpenAPI in `lib/api-spec/openapi.yaml` drives codegen for both
  `@workspace/api-zod` and `@workspace/api-client-react`.
- DM RBAC: crew→client DM is forbidden (403); owners/partners may DM
  anyone.
- Hourly background job sends review reminders for stalled deliverables.

## Frontend Architecture (`artifacts/pgtsnd-website`)
- React + Vite with `wouter` routing.
- **Client Hub (`/client-hub/*`)** — dashboard, messages, project
  progress (Treatment / Storyboard / Shot List / Notes — never raw
  tasks), asset library (approved deliverables only), video review,
  contracts, billing. Strict B&W palette, no italics.
- **Team Portal (`/team/*`)** — dashboard with pipeline + crew status
  + revenue snapshot, project workspace (Overview / Milestones /
  Deliverables / Assets / Review), CRM, messages with project-groups
  and DMs toggle, schedule, asset library, crew, settings, access
  tokens, admin email previews.
- **Auth UI**: single token-only sign-in form for both the team and
  the client. Demo access tokens (`DEMO-OWNER-2026`, `DEMO-CREW-2026`,
  `DEMO-CLIENT-2026`) are surfaced in a "Demo Access" panel on both
  sign-in pages.
- **Hooks**: `useAuth()` is the source of truth for user state;
  `useTeamData.ts` centralizes Team Portal queries; `useUnreadSummary`
  drives the Messages-tab badges; `useRecentClientActivity` drives
  cross-project desktop notifications.
- **Theming**: dark/light toggle on team-side; client side is pinned
  to dark B&W.
- **Design language**: Montserrat headings, pill-shaped CTA buttons,
  high contrast.

## Notifications
- Email helpers live in `services/notifications.ts`. They all consult
  `project_notification_mutes` before sending.
- Coverage includes: new messages, new client messages, new comments,
  comment replies, comment resolved, **comment reopened**, deliverable
  status changes, contract events, invoice events.
- Browser desktop notifications fire from the Messages page only and
  respect per-project mutes via the in-page `ProjectMuteToggle`.

## Security
- Integration credentials encrypted at rest with AES-256-GCM via the
  `Vault` helper. Master key from `VAULT_MASTER_KEY`.
- Demo access tokens auto-create their user on first use and re-pin
  the user's role/name on every sign-in so their role can't drift.
- Access tokens are hashed in the DB; only the hash is stored.
  Revocation is enforced on every `/auth/me` lookup via `tokenId`.

## Deployment
- Two artifacts publish: `pgtsnd-website` (static `vite build`) and
  `api-server` (esbuild bundle to `dist/index.mjs`, run with `node`).
- The API server applies the latest schema at **runtime** on startup
  when `RUN_DB_PUSH_ON_BOOT=true` (set in the production artifact env).
  Implementation lives in `artifacts/api-server/src/index.ts` and
  spawns `pnpm --filter @workspace/db run push-force`. A failed push
  is logged but does NOT crash the server, so a transient DB issue
  can't block the deploy from coming up.
- `drizzle-kit` lives in `lib/db` **dependencies** (not devDeps) so
  prod-only installs still have it available at runtime.
- Do NOT put `pnpm db push` in the deploy build step — it requires
  `DATABASE_URL` at build time, which Replit Autoscale doesn't always
  provide, and would block the deploy on a DB that's reachable later
  anyway.

# External Dependencies

- **Stripe** — invoicing, Stripe Checkout, webhook handling
  (`checkout.session.completed`, `invoice.paid`, etc.).
- **Google Drive** — folder picker per project (with cached BFS
  parent-path resolution + match highlighting), file listing, signed
  URLs.
- **Slack** — outbound messages, channel listing, message history.
- **DocuSign** — contract envelopes, signing URLs, status webhooks.
- **Resend** — transactional email delivery.

# Where to Look First

- "What does the app do?" → `FEATURES.md`
- "How does X work in code?" → search the relevant route file under
  `artifacts/api-server/src/routes/` and the matching page in
  `artifacts/pgtsnd-website/src/pages/`.
- "What's in the database?" → `lib/db/src/schema/`
- "What's the API contract?" → `lib/api-spec/openapi.yaml` (do not
  hand-edit) and the generated `@workspace/api-zod`.
