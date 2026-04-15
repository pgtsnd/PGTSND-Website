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
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Artifacts

### PGTSND Productions Website (`artifacts/pgtsnd-website`)
- **Type**: React + Vite (frontend-only, no backend)
- **Preview path**: `/`
- **Purpose**: Pixel-faithful clone of pgtsndproductions.com migrated from Squarespace
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
- **Team Portal** (`/team/*`): Admin/production team dashboard — uses `TeamLayout.tsx` sidebar layout, logged in as Bri Dwyer (Director/Producer)
  - **Dashboard** (`TeamDashboard.tsx`): Stat cards (active projects, tasks, pending client actions, crew), active project cards, "Waiting on Client" queue with wait times, recent activity feed, team workload matrix (tasks + projects per crew member)
  - **Projects** (`TeamProjects.tsx`): All projects list with status filters (Active/Paused/Completed/Archived), progress bars, team avatar stacks, task counts, due dates; "New Project" button; 6 sample projects across 3 clients
  - **Project Detail** (`TeamProjectDetail.tsx`): `/team/projects/:id` — Overview tab with stats, document status (draft/final) with Edit buttons, client review queue (pending/changes requested) with Remind button, quick actions (Upload Assets, Send to Review, Update Schedule, Generate Invoice); tabbed views for Schedule, Assets, Review (placeholder); team roster + recent messages sidebar
  - Sidebar: Dashboard, Projects, Clients, Messages (badge), Schedule, Asset Library, Crew, Settings
- **Design**: Black background, white text, bold Montserrat 900 weight headings, pill-shaped CTA buttons, hamburger nav overlay
- **Images**: Loaded directly from Squarespace CDN URLs
- **Logo**: Uses attached_assets/logo.webp via @assets alias
- **No backend required**: Pure frontend, contact form is client-side only

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
