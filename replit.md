# Overview

This project is a pnpm workspace monorepo using TypeScript, designed to manage a full-stack application for PGTSND Productions. It includes a client-facing portal and a team/admin portal, aiming to streamline project management, client communication, asset delivery, and financial operations. The system supports various user roles with tailored access, integrates with external services for enhanced functionality, and provides a robust, real-time platform for production companies.

The business vision is to provide an all-encompassing digital platform for production companies to efficiently manage projects from lead to delivery, enhance client engagement through a dedicated portal, and optimize internal team workflows. The market potential lies in offering a specialized, integrated solution that addresses the unique needs of the media production industry, improving operational efficiency and client satisfaction.

# User Preferences

I want iterative development.
Ask before making major changes.
Do not make changes to folder `lib/api-spec`.
Do not make changes to files with `test` in their name.

# System Architecture

## Monorepo Structure
The project is organized as a pnpm workspace monorepo, with each package managing its own dependencies. This structure facilitates code sharing and consistent tooling across the application.

## Technology Stack
- **Node.js**: Version 24
- **Package Manager**: pnpm
- **TypeScript**: Version 5.9
- **API Framework**: Express 5
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod (v4) integrated with `drizzle-zod`
- **API Codegen**: Orval, generating types and hooks from OpenAPI specifications
- **Build Tool**: esbuild (for CJS bundles)

## Database Schema Highlights
The database utilizes text UUIDs for primary keys. Key entities include:
- `users`: Stores system users with roles (owner, partner, crew, client).
- `organizations`: Client companies.
- `projects`: Central entity with a detailed lifecycle and phases (pre_production, production, post_production, review, delivered).
- `tasks`: Project-scoped tasks with status, assignee, and dependencies.
- `deliverables`: Project outputs with review states and linked to reviews.
- `contracts`: Manages project contracts, including DocuSign integration fields.
- `invoices`: Handles billing with Stripe integration fields and various statuses.
- `integration_settings`: Stores encrypted configurations for external services (Stripe, Google Drive, Slack, DocuSign).
- `video_comments` and `video_comment_replies`: Supports timestamped, threaded comments on video deliverables.

## API Architecture
- All API routes are mounted under `/api` using Express.
- Authentication uses session-based JWTs (`pgtsnd_session` cookie).
- Role-based access control (RBAC) is enforced through middleware.
- Zod validation is applied to all incoming request payloads using Drizzle-Zod generated schemas.
- OpenAPI specification at `lib/api-spec/openapi.yaml` drives API documentation and code generation.
- Automated review reminder jobs run hourly for deliverables.

## UI/UX and Frontend Architecture
The frontend consists of the PGTSND Productions Website, built with React and Vite. It features:
- **Client Portal (`/client-hub/*`)**: Provides clients with a dashboard, messaging, project overview (without granular tasks), asset review, video review with timestamped comments, contract management, and billing. The client portal is fully wired to the API.
  - **Client-specific features**: Dashboard with review queue, messages with real-time send, project progress views (Treatment, Storyboard, Shot List, Notes), asset management showing approved deliverables, and comprehensive video review system.
- **Team Portal (`/team/*`)**: Designed for internal teams (admin, production) with a dashboard, project management (detailed workspace with milestones, deliverables, assets, review), CRM for clients, team messaging, schedule, asset library, crew management, and settings. All pages are connected to the API.
  - **Team-specific features**: Owner dashboard with pipeline, crew status, revenue snapshot, production schedule (Gantt charts). Project workspace with 5 tabs (Overview, Milestones, Deliverables, Assets, Review). Full CRM, Crew management with detailed member profiles, rates, and tax info.
- **Authentication**: Supports magic link email login, Google SSO, and a demo bypass. JWT sessions are stored in HTTP-only cookies. Role-based routing ensures appropriate access.
- **Theming**: Implements a dark/light mode toggle with specific color palettes.
- **Design Language**: Features a black background, white text, bold Montserrat headings, and pill-shaped CTA buttons.

## Technical Implementations
- API codegen produces `@workspace/api-zod` (Zod schemas) and `@workspace/api-client-react` (React Query hooks) for type-safe API interactions.
- `useAuth()` and `useTeamData.ts` hooks manage user authentication state and data fetching for the Team Portal, ensuring data is fetched only when a user is authenticated.
- Integration services use a `Vault` for encrypting sensitive credentials via AES-256-GCM, with a `VAULT_MASTER_KEY` environment variable.

# External Dependencies

- **Stripe**: For invoicing, payment processing via Stripe Checkout, and webhook handling (e.g., `checkout.session.completed`, `invoice.paid`).
- **Google Drive**: For file storage, listing, and generating download URLs.
- **Slack**: For sending messages, listing channels, and accessing message history.
- **DocuSign**: For sending contract envelopes, retrieving signing URLs, and tracking status via webhooks.