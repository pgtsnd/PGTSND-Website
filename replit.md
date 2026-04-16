# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM (tables: `users`, `magic_link_tokens`)
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

## API Architecture

- All API routes mounted at `/api` via Express router
- Health check at `/api/healthz` (unauthenticated)
- All other routes require `x-user-id` header for auth (placeholder for real auth)
- Role-based access control middleware: owner/partner see everything, crew see assigned projects, clients see own projects
- Zod validation on all create/update inputs via Drizzle-Zod generated schemas
- OpenAPI spec at `lib/api-spec/openapi.yaml` documents all endpoints
- Codegen produces `@workspace/api-zod` (Zod schemas) and `@workspace/api-client-react` (React Query hooks)

## Artifacts

### PGTSND Productions Website (`artifacts/pgtsnd-website`)
- **Type**: React + Vite (frontend-only, no backend)
- **Preview path**: `/`
- **Purpose**: Pixel-faithful clone of pgtsndproductions.com (originally built on Squarespace)
- **Pages**: Home, Services, About, Case Studies, Contact, Client Hub (login/register with magic link + invite token)
- **Client Portal** (`/client-hub/*`): Dashboard, Messages, Projects, Assets, Video Review, Contracts, Billing, Account — uses `ClientLayout.tsx` sidebar layout, all mock data for now
  - **Dashboard**: Welcome banner, review queue with reminders, recent messages feed, active project status cards
  - **Messages** (`ClientMessages.tsx`): Full threaded chat with conversation sidebar, team/client bubble layout, file attachments, unread badges
  - **Projects** (`ClientProjects.tsx`): Gantt-style schedule with 29 tasks across 5 phases, collapsible phase rows, assignee column, weekly timeline grid, "TODAY" marker; Project Documents section links to dedicated subpages, team roster
  - **Treatment** (`ProjectTreatment.tsx`): `/client-hub/projects/:id/treatment` — long-form written narrative (~1000 words), blog-post style, author + date, cross-links to storyboard/shotlist
  - **Storyboard** (`ProjectStoryboard.tsx`): `/client-hub/projects/:id/storyboard` — visual mood board with gradient placeholder cards per scene, mood tags, camera notes
  - **Shot List** (`ProjectShotList.tsx`): `/client-hub/projects/:id/shotlist` — detailed scene-grouped table of all planned shots with type (Hero/B-Roll/Aerial/Macro/Slo-Mo/Interview), lens, camera movement, captured checkmarks, scene/type filters, progress bar
  - **Client Notes** (`ProjectNotes.tsx`): `/client-hub/projects/:id/notes` — pinned important notes + chronological timeline, client vs team attribution, tagged categories
  - **Assets** (`ClientAssets.tsx`): Finder-style folder browser with breadcrumbs, folder grid → file list view, drag-drop upload zone, download icons
  - **Video Review** (`ClientVideoReview.tsx`): Video player with colored timeline dots per comment, clickable dots to highlight comment, threaded replies, "Approve This Draft" / "Request Changes" buttons, version selector
  - **Contracts** (`ClientContracts.tsx`): DocuSign links and signed copies; MSA, SOW, NDA, Release, Amendment types; pending signature alerts with "Sign in DocuSign" CTA; expandable signer status and details; Download PDF for signed copies
  - **Billing** (`ClientBilling.tsx`): Invoice table with Pay Now buttons, subscriptions & recurring section, payment history with CSV export, payment method cards (Visa/ACH), Pay modal with payment method selector and Confirm Payment button
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
- **Backend**: Team Portal uses API server; public pages (Home, Services, etc.) and Client Portal are frontend-only with mock data

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
