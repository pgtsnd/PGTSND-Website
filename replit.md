# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/db run seed` — seed demo data into the database
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Database Schema

All tables use text UUIDs as primary keys (generated via `randomUUID()`).

- **users** — All system users with roles: owner, partner, crew, client
- **organizations** — Client companies/organizations
- **projects** — Central entity with lifecycle: lead → active → in_progress → review → delivered → archived. Has phases: pre_production, production, post_production, review, delivered
- **project_members** — Many-to-many join between projects and users (composite PK)
- **phases** — Production phases within a project (Pre-Production, Production, Post-Production, Delivery). Has name, sortOrder, projectId FK
- **tasks** — Belong to projects, track status (todo/in_progress/done/blocked), progress, assignee, dependencies. Optional phaseId FK to phases table
- **task_items** — Checklist items within tasks
- **deliverables** — Link to projects (and optionally tasks), with review states: draft, pending, in_review, approved, revision_requested
- **reviews** — Review records for deliverables, linked to a reviewer
- **messages** — Project-scoped messages with read status
- **contracts** — Project contracts (SOW, amendments, etc.) with status: draft, sent, signed, expired. Includes DocuSign fields: `docusign_envelope_id`, `docusign_signing_url`
- **review_reminders** — Tracks automated review reminders per deliverable (day 3, 5, 7+ daily), FK to deliverables
- **invoices** — Billing invoices linked to projects with Stripe fields: `stripe_invoice_id`, `stripe_payment_intent_id`, `stripe_hosted_url`, `stripe_pdf_url`. Status: draft, sent, paid, overdue, void
- **integration_settings** — External service configurations (Stripe, Google Drive, Slack, DocuSign) with encrypted config storage. Type enum: stripe, google_drive, slack, docusign
- **video_comments** — Timestamped comments on deliverables: authorId, authorName, timestampSeconds, content. FK to deliverables and users
- **video_comment_replies** — Threaded replies on video comments: authorId, authorName, content. FK to video_comments
- **review_links** — Shareable review URLs with unique token, optional expiration. FK to deliverables and users

## API Architecture

- All API routes mounted at `/api` via Express router
- Health check at `/api/healthz` (unauthenticated)
- Auth middleware verifies `pgtsnd_session` JWT cookie for session-based auth
- Role-based access control middleware: owner/partner see everything, crew see assigned projects, clients see own projects
- Client-specific routes under `/api/client/*`: dashboard aggregation, messages (with send), deliverables, contracts, profile (get/update), approve/request-revision workflow
- Team workflow endpoint `POST /api/deliverables/:id/submit-for-review` transitions deliverables to `in_review` status with guards (owner/partner/crew only, prevents re-submission of already-reviewed items)
- Automated review reminder job runs hourly, sends reminders at 3/5/7+ day intervals for unreviewed deliverables
- Zod validation on all create/update inputs via Drizzle-Zod generated schemas
- OpenAPI spec at `lib/api-spec/openapi.yaml` documents all endpoints
- Codegen produces `@workspace/api-zod` (Zod schemas) and `@workspace/api-client-react` (React Query hooks)

## Artifacts

### PGTSND Productions Website (`artifacts/pgtsnd-website`)
- **Type**: React + Vite (frontend-only, no backend)
- **Preview path**: `/`
- **Purpose**: Pixel-faithful clone of pgtsndproductions.com (originally built on Squarespace)
- **Pages**: Home, Services, About, Case Studies, Contact, Client Hub (login/register with magic link + invite token)
- **Client Portal** (`/client-hub/*`): Dashboard, Messages, Projects, Assets, Video Review, Contracts, Billing, Account — uses `ClientLayout.tsx` sidebar layout with dynamic user info, all pages wired to real API via fully-typed `src/lib/api.ts` (no `any` types)
  - **Dashboard**: Welcome banner, review queue with reminder counts, recent messages feed, active project status cards with calculated progress
  - **Messages** (`ClientMessages.tsx`): Full threaded chat with conversation sidebar, team/client bubble layout, unread badges, real-time send
  - **Projects** (`ClientProjects.tsx`): Aggregate progress view with stats cards (Total Tasks, Complete, In Progress, Upcoming), progress bar, project description, due date, budget, and team roster — NO individual task rows visible to clients
  - **Treatment** (`ProjectTreatment.tsx`): `/client-hub/projects/:id/treatment` — long-form written narrative (~1000 words), blog-post style, author + date, cross-links to storyboard/shotlist
  - **Storyboard** (`ProjectStoryboard.tsx`): `/client-hub/projects/:id/storyboard` — visual mood board with gradient placeholder cards per scene, mood tags, camera notes
  - **Shot List** (`ProjectShotList.tsx`): `/client-hub/projects/:id/shotlist` — detailed scene-grouped table of all planned shots with type (Hero/B-Roll/Aerial/Macro/Slo-Mo/Interview), lens, camera movement, captured checkmarks, scene/type filters, progress bar
  - **Client Notes** (`ProjectNotes.tsx`): `/client-hub/projects/:id/notes` — pinned important notes + chronological timeline, client vs team attribution, tagged categories
  - **Assets** (`ClientAssets.tsx`): Shows only approved deliverables as asset cards, filterable by project, with type labels and version info
  - **Video Review** (`ClientVideoReview.tsx`): Full video review system with custom HTML5 video player, timestamped comments (markers on timeline, click-to-jump), threaded replies, version selector, approve/request-revision workflow
  - **Contracts** (`ClientContracts.tsx`): DocuSign links for pending signatures; filterable (All/Pending/Signed); expandable details with project, type, amount, dates
  - **Billing** (`ClientBilling.tsx`): Derived from contract data — summary cards (Total Paid, Outstanding, Total Contracts), contract summary table, Stripe integration placeholder
- **Theme System** (`ThemeContext.tsx`): Dark/light mode toggle in sidebar; dark mode uses `#111114` gray (not pure black), light mode uses `#f4f4f6`; all portal pages consume `useTheme()` with `t.*` token variables for backgrounds, text, borders, cards, modals
  - Assets page has grid/list view toggle, thumbnail cards with colored gradient placeholders, "Send to Review" button on draft videos, breadcrumb navigation, and drag-drop upload zone
  - Video Review links back to Assets via "View in Assets" source file row
- **Team Portal** (`/team/*`): Admin/production team portal — uses `TeamLayout.tsx` sidebar layout, **all pages wired to real API data** via `@workspace/api-client-react`
  - **Auth**: Uses the same JWT cookie-based session as Client Portal (magic link + Google SSO + demo bypass); `TeamAuthProvider` wraps entire app in `App.tsx` and derives team context from `useAuth()` session
  - **Hooks**: `useTeamData.ts` exports hooks (`useProjects`, `useOrganizations`, `useUsers`, `useProjectWithDetails`, `useDashboardData`, etc.) — all gated with `enabled: !!userId` where userId is derived from the JWT cookie session via `useAuth()`; API calls include `credentials: "include"` for automatic cookie auth
  - **Owner Dashboard** (`TeamDashboard.tsx`): Personalized welcome, Pipeline phase counts, Crew Status, Revenue Snapshot, Production Schedule (expandable per-project Gantt charts showing phase timelines with "Today" marker and progress fill) — all from real project/user data
  - **Projects** (`TeamProjects.tsx`): Real project cards with status filters, progress bars, organization names
  - **Project Workspace** (`TeamProjectDetail.tsx`): `/team/projects/:id` — 5-tab workspace: Overview (stats + contracts, no Team section), Milestones (3-level hierarchy: Phase → Milestone → Task with inline CRUD, progress bars per phase, collapsible sections; phases API at `/api/projects/:id/phases`), Deliverables (expandable cards with descriptions/metadata), Assets (drag-drop upload zone + project folder grid), Review (video player with timestamped comments, push-to-client, shareable review links)
  - **Clients** (`TeamClients.tsx`): `/team/clients` — Full CRM hub with summary stats (Total Scope, Collected, Outstanding, Active Clients), expandable client rows with 3 tabs: Overview (contact details, financial summary with collection progress bar, active projects), Projects & Scope (per-project budget/paid/outstanding breakdown with invoice history), Invoices (create/send/mark-paid/void invoices, invoice table with status badges and actions)
  - **Messages** (`TeamMessages.tsx`): `/team/messages` — Real messages grouped by project, send new messages via API
  - **Schedule** (`TeamSchedule.tsx`): `/team/schedule` — Timeline and Upcoming views from real project dates
  - **Asset Library** (`TeamAssets.tsx`): `/team/assets` — Deliverables from all projects
  - **Crew** (`TeamCrew.tsx`): `/team/crew` — Real team members with roles, project assignments
  - **Settings** (`TeamSettings.tsx`): `/team/settings` — Profile update via `useUpdateProfile` mutation
  - Sidebar: Dashboard, Projects, Clients, Messages (badge), Schedule, Asset Library, Crew, Settings — user info from `currentUser`
  - Seed users: bri@pgtsnd.com (owner), marcus/jamie/alex/sam@pgtsnd.com (crew), testcrew@pgtsnd.com (crew/PA), kandice@pgtsnd.com (partner), nicole@netyourproblem.com, marcus@tranarch.com, lena@cascadecoffee.com, ryan@vallationouterwear.com (clients), testclient@pgtsnd.com (client, assigned to proj1+proj3)
  - Seed data includes: projects, tasks, deliverables, contracts, invoices, messages, review reminders
- **Design**: Black background, white text, bold Montserrat 900 weight headings, pill-shaped CTA buttons, hamburger nav overlay
- **Images**: Served locally from `public/images/` (migrated from Squarespace CDN)
- **Logo**: Uses src/assets/logo.webp via @assets alias
- **Authentication**: Magic link email login + Google SSO + demo bypass (`demo@pgtsnd.com`), JWT sessions in httpOnly cookies, role-based routing (client → client hub, crew/partner/owner → team portal), protected route guards on all dashboard pages. In dev mode, any seeded user email auto-logs in (no magic link needed).
  - **Test logins**: `test@pgtsnd.com` (owner → /team/dashboard, sees all 5 projects), `testcrew@pgtsnd.com` (crew → /team/dashboard, sees 3 assigned projects), `testclient@pgtsnd.com` (client → /client-hub/dashboard, sees 2 projects: Net Your Problem + Pacific NW Health)
  - **Demo bypass**: `demo@pgtsnd.com` (owner role, works on both portals)
- **External Integrations**: Backend service modules at `artifacts/api-server/src/services/` for Stripe (invoicing/payments), Google Drive (file storage), Slack (messaging bridge), DocuSign (contract signing). Each integration stores credentials in `integration_settings` DB table. Manage connections via Team Settings → Integrations panel. API routes at `/api/integrations/*` for status, config, and service-specific operations.
  - **Stripe**: Invoice creation, sending, payment tracking via webhooks (`/api/webhooks/stripe`)
  - **Google Drive**: Folder-scoped file listing, download URLs (`/api/integrations/drive/files`)
  - **Slack**: Send messages, list channels, get history (`/api/integrations/slack/*`)
  - **DocuSign**: Send envelopes, get signing URLs, status tracking via webhooks (`/api/webhooks/docusign`)
- **Backend**: Both Team Portal and Client Portal use API server for real data; public pages (Home, Services, etc.) are frontend-only. Client Portal pages (Billing, Messages, Assets, Contracts) now wired to real API data.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
