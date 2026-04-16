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
- **tasks** — Belong to projects, track status (todo/in_progress/done/blocked), progress, assignee, dependencies
- **task_items** — Checklist items within tasks
- **deliverables** — Link to projects (and optionally tasks), with review states: draft, pending, in_review, approved, revision_requested
- **reviews** — Review records for deliverables, linked to a reviewer
- **messages** — Project-scoped messages with read status
- **contracts** — Project contracts (SOW, amendments, etc.) with status: draft, sent, signed, expired
- **review_reminders** — Tracks automated review reminders per deliverable (day 3, 5, 7+ daily), FK to deliverables

## API Architecture

- All API routes mounted at `/api` via Express router
- Health check at `/api/healthz` (unauthenticated)
- Auth middleware reads `x-user-id` header first, then falls back to `pgtsnd_session` JWT cookie for cookie-based auth
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
  - **Video Review** (`ClientVideoReview.tsx`): Review interface with deliverable selector, approve/request-revision workflow buttons, feedback history, status labels
  - **Contracts** (`ClientContracts.tsx`): DocuSign links for pending signatures; filterable (All/Pending/Signed); expandable details with project, type, amount, dates
  - **Billing** (`ClientBilling.tsx`): Derived from contract data — summary cards (Total Paid, Outstanding, Total Contracts), contract summary table, Stripe integration placeholder
- **Theme System** (`ThemeContext.tsx`): Dark/light mode toggle in sidebar; dark mode uses `#111114` gray (not pure black), light mode uses `#f4f4f6`; all portal pages consume `useTheme()` with `t.*` token variables for backgrounds, text, borders, cards, modals
  - Assets page has grid/list view toggle, thumbnail cards with colored gradient placeholders, "Send to Review" button on draft videos, breadcrumb navigation, and drag-drop upload zone
  - Video Review links back to Assets via "View in Assets" source file row
- **Team Portal** (`/team/*`): Admin/production team portal — uses `TeamLayout.tsx` sidebar layout, **all pages wired to real API data** via `@workspace/api-client-react`
  - **Auth**: Email login via `POST /api/auth/login`; stores userId in localStorage as `team-user-id`; sends `x-user-id` header on all API calls via `setCustomHeadersGetter`; `TeamAuthProvider` wraps entire app in `App.tsx`
  - **Hooks**: `useTeamData.ts` exports hooks (`useProjects`, `useOrganizations`, `useUsers`, `useProjectWithDetails`, `useDashboardData`, etc.) — all gated with `enabled: !!userId` from `useTeamAuth()`
  - **Owner Dashboard** (`TeamDashboard.tsx`): Personalized welcome, Pipeline phase counts, Crew Status, Revenue Snapshot — all from real project/user data
  - **Projects** (`TeamProjects.tsx`): Real project cards with status filters, progress bars, organization names
  - **Project Workspace** (`TeamProjectDetail.tsx`): `/team/projects/:id` — 6-tab workspace with real tasks, deliverables, contracts, members
  - **Clients** (`TeamClients.tsx`): `/team/clients` — Organization cards with project counts, revenue, expandable project lists
  - **Messages** (`TeamMessages.tsx`): `/team/messages` — Real messages grouped by project, send new messages via API
  - **Schedule** (`TeamSchedule.tsx`): `/team/schedule` — Timeline and Upcoming views from real project dates
  - **Asset Library** (`TeamAssets.tsx`): `/team/assets` — Deliverables from all projects
  - **Crew** (`TeamCrew.tsx`): `/team/crew` — Real team members with roles, project assignments
  - **Settings** (`TeamSettings.tsx`): `/team/settings` — Profile update via `useUpdateProfile` mutation
  - Sidebar: Dashboard, Projects, Clients, Messages (badge), Schedule, Asset Library, Crew, Settings — user info from `currentUser`
  - Seed users: bri@pgtsnd.com (owner), marcus/jamie/alex@pgtsnd.com (crew), sam@pgtsnd.com (crew), kandice@pgtsnd.com (partner)
- **Design**: Black background, white text, bold Montserrat 900 weight headings, pill-shaped CTA buttons, hamburger nav overlay
- **Images**: Served locally from `public/images/` (migrated from Squarespace CDN)
- **Logo**: Uses src/assets/logo.webp via @assets alias
- **Authentication**: Magic link email login + Google SSO + demo bypass (`demo@pgtsnd.com`), JWT sessions in httpOnly cookies, role-based routing (client → client hub, crew/partner/owner → team portal), protected route guards on all dashboard pages
- **Backend**: Both Team Portal and Client Portal use API server for real data; public pages (Home, Services, etc.) are frontend-only

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
