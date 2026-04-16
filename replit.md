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
- **Team Portal** (`/team/*`): Admin/production team portal — uses `TeamLayout.tsx` sidebar layout, logged in as Bri Dwyer (Director/Producer)
  - **Owner Dashboard** (`TeamDashboard.tsx`): Bri's private command center — "Needs Attention" section with urgency-colored left borders and action buttons (Nudge Client / Resend), circular progress ring project cards, Pipeline visualization (Pre-Production → Delivered), Crew Status with current activity, Revenue Snapshot ($12.4k month / $67.8k YTD)
  - **Projects** (`TeamProjects.tsx`): Visual 2-column card grid with monochrome gradient thumbnails, status filters (Active/Paused/Completed/Archived), team avatar stacks, progress bars, "New Project" button; 6 sample projects across 4 clients
  - **Project Workspace** (`TeamProjectDetail.tsx`): `/team/projects/:id` — Full editing workspace with 6 tabs:
    - **Overview**: Stats cards (progress, phase, shots captured, pending reviews), "Jump into work" action cards linking to other tabs, client review queue with Nudge button
    - **Treatment**: Rich text editor with formatting toolbar (B/I/H1/H2), editable textarea with full treatment content, Save + Share with Client buttons
    - **Storyboard**: Visual 2-column grid of scene cards, each with clickable image upload zone, editable title/description/mood fields, scene numbering, "Add Scene" button
    - **Shot List**: Editable spreadsheet table with Scene/Shot/Type/Lens/Movement/Description columns, click-to-edit rows with input fields and type dropdown, checkbox toggles for "captured" status with progress bar, "Add Shot" button
    - **Files**: Drag-drop upload zone, folder grid (Raw Footage, Exports, Sound Design, Color Grades, Client Deliverables, BTS Photos)
    - **Review**: Client review items with urgency indicators, Nudge Client / View Comments / Open in Player buttons, "Send New Cut for Review"
  - All 6 projects (IDs 1-6) have detail data; state resyncs on route change via useEffect
  - **Clients** (`TeamClients.tsx`): `/team/clients` — 2-column card grid with avatar, company, role, project/active/revenue stats, Email + Message buttons, expandable project list linking to project detail
  - **Messages** (`TeamMessages.tsx`): `/team/messages` — Split-pane inbox: thread list (client vs team avatars, unread badges, project context) + chat view with bubble layout (outgoing right-aligned), compose input, "View Project" link
  - **Schedule** (`TeamSchedule.tsx`): `/team/schedule` — Two views: Timeline (Gantt-style bars with milestone dots + "Today" column highlight) and Upcoming (event cards with date, crew chips, project/time)
  - **Asset Library** (`TeamAssets.tsx`): `/team/assets` — Project filter tabs, 3-column folder grid with file-type icons + metadata, Recent Files list with download buttons, Upload button
  - **Crew** (`TeamCrew.tsx`): `/team/crew` — Expandable member rows with avatar, role, current project, availability status (Available/Busy), expanded detail shows email/phone/rate/skills/project count
  - **Settings** (`TeamSettings.tsx`): `/team/settings` — Left nav with 4 sections: Company Profile (editable form), Notifications (toggle switches with aria-labels), Integrations (connect buttons), Billing & Plans (plan card with storage bar, payment method)
  - Sidebar: Dashboard, Projects, Clients, Messages (badge), Schedule, Asset Library, Crew, Settings
- **Design**: Black background, white text, bold Montserrat 900 weight headings, pill-shaped CTA buttons, hamburger nav overlay
- **Images**: Served locally from `public/images/` (migrated from Squarespace CDN)
- **Logo**: Uses src/assets/logo.webp via @assets alias
- **No backend required**: Pure frontend, contact form is client-side only

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
