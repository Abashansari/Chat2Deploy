# Ansar AI

<div align="center">

### Turn an idea into a deployable website—with AI.

Ansar AI is an AI-powered website workspace for generating responsive static websites, previewing them live, reviewing version history, and publishing them to Cloudflare Pages.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-20232A?logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com)

</div>

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Screenshots](#screenshots)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [How It Works](#how-it-works)
- [Project Structure](#project-structure)
- [Installation and Setup](#installation-and-setup)
- [Environment Variables](#environment-variables)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Deployment Guide](#deployment-guide)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)
- [Testing](#testing)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Contact and Support](#contact-and-support)

## Overview

**Ansar AI** is a full-stack website generation platform built for individuals and teams that want to go from natural-language instructions to a responsive static website quickly.

The application combines authenticated project management, Google Gemini generation, Supabase persistence, live in-app previews, version snapshots and rollback, and Cloudflare Pages deployment. It is designed for creators who want an end-to-end workflow without leaving a single workspace.

> Generated sites are standard multi-file HTML, CSS, and JavaScript projects. Ansar AI does not generate React or JSX source for the deployed site.

## Key Features

- **Prompt-based website generation** — Generate complete HTML, CSS, and vanilla JavaScript websites from natural-language prompts.
- **Targeted AI modifications** — Re-submit prompts after generation to update the existing project instead of replacing every file blindly.
- **Live responsive preview** — Preview the latest output in desktop, tablet, and mobile viewports through a sandboxed iframe.
- **Cloudflare Pages deployment** — Publish generated static files and receive a deployed `.pages.dev` URL.
- **Automatic version snapshots** — Successful generations create versioned project snapshots; previous versions can be restored.
- **Project dashboard** — Create, rename, search, filter, delete, and monitor projects and deployment history.
- **Deployment management** — Track deployment status, source version, duration, URL, and remove deployments to return projects to draft state.
- **Supabase authentication** — Registration, password login, password reset, OAuth callback support, and protected routes.
- **User profiles and RLS** — Projects and generated files are associated with Supabase users and protected by database policies.
- **Analytics and reports** — Dashboard charts and downloadable PDF analytics reports.
- **Upstash Redis caching** — Cached project, version, dashboard, and deployment reads with fail-open behavior and cache invalidation.
- **Career and contact workflows** — Career applications, application status notifications, and validated contact-form email delivery.
- **Dark and light themes** — Theme switching across the public and authenticated interface.

## Screenshots

<details open>
<summary><strong>Application preview</strong></summary>

> Screenshots are not currently stored in the repository. Add captured images from the running application here when they are available.

```text
[ Landing Page Screenshot ]
[ Dashboard Screenshot ]
[ AI Workspace Screenshot ]
[ Version History Screenshot ]
```

</details>

## Technology Stack

| Category | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 16, React 19 | App Router UI, server and client components |
| Language | TypeScript 5 | Typed application and API implementation |
| Styling | Tailwind CSS 4 | Responsive visual system and theme styles |
| UI | Lucide React | Icon library |
| Charts | Recharts | Dashboard analytics and charts |
| Authentication | Supabase Auth | Login, registration, password reset, sessions |
| Database | Supabase Postgres | Projects, files, chat history, versions, deployments, careers |
| Data security | Supabase Row Level Security | Ownership- and user-scoped database access |
| AI | Google Gemini via `@google/genai` | Generate and modify static website files |
| Hosting | Cloudflare Pages, Wrangler | Static-site project creation and deployment |
| Cache | Upstash Redis | Dashboard, project, deployment, and version caching |
| Email | Resend | Contact and career application notifications |
| PDF | PDFKit | Downloadable analytics reports |
| Testing | Playwright | Browser and end-to-end test configuration |
| Package management | npm, `package-lock.json` | Dependency installation and reproducible builds |

## System Architecture

```mermaid
flowchart LR
    U[User] --> UI[Next.js 16 Frontend]
    UI --> AUTH[Supabase Auth]
    UI --> API[Next.js API Routes]

    API --> AI[Google Gemini]
    AI --> FILES[Generated HTML, CSS, JS]
    FILES --> DB[(Supabase Postgres)]

    DB --> PREVIEW[/Preview API /api/preview/:projectId/*]
    PREVIEW --> IFRAME[Live iframe preview]

    API --> CACHE[(Upstash Redis)]
    CACHE -. cache fallback .- DB

    API --> CF[Cloudflare Pages API and Wrangler]
    CF --> HOST[Public .pages.dev website]

    API --> EMAIL[Resend]
```

### Data flow

1. Supabase authenticates the user and provides a server-side session.
2. The workspace requests project files, chat history, versions, and deployment records.
3. `/api/generate` verifies project ownership and asks Gemini to create or modify files.
4. Generated files are stored in `project_files`; chat and generation history are recorded.
5. Every successful generation creates a version snapshot.
6. The preview route reads the stored `index.html` and serves project files with appropriate MIME types.
7. Deployment sends the stored static files to Cloudflare Pages through Wrangler and Cloudflare APIs.
8. Supabase stores deployment metadata; Redis caches reads and is invalidated after mutations.

## How It Works

1. **Sign in** using an existing account or create a new account.
2. **Create or open a project** from the user dashboard.
3. **Describe the website** in the workspace chat prompt.
4. **Generate the site**—Gemini returns a title, description, and standard static files.
5. **Preview the result** in desktop, tablet, or mobile mode.
6. **Iterate with follow-up prompts** to modify the existing generated files.
7. **Review versions** and restore an earlier snapshot when needed.
8. **Deploy** the project to Cloudflare Pages and open the returned public URL.

For subsequent prompts, Ansar AI reads the current files and recent chat history and sends them as modification context to Gemini.

## Project Structure

```text
app/
├── api/                         # Server-side Next.js route handlers
│   ├── generate/                # Gemini generation and modification
│   ├── preview/[projectId]/     # Generated-file preview delivery
│   ├── deploy/                  # Cloudflare Pages deployment
│   ├── projects/                # Project CRUD
│   ├── deployments/             # Deployment history and removal
│   ├── versions/                # Snapshots and rollback
│   ├── dashboard/               # Stats, reports, cache purge
│   ├── notifications/           # In-app career notifications
│   ├── careers/                 # Career application submission
│   ├── contact/                 # Contact form delivery
│   └── admin/careers/           # Career application administration
├── components/                  # Shared UI and workspace components
├── dashboard/                   # Authenticated analytics and project dashboard
├── workspace/[projectId]/       # AI chat, preview, deploy, and version workspace
├── login/ register/             # Account authentication pages
├── forgot-password/ reset-password/
├── careers/ my-applications/    # Career application user flows
└── contact/ about/ docs/        # Public information pages

lib/
├── ai/gemini.ts                 # Gemini key pool, retry, fallback, generation
├── cloudflare.ts                # Cloudflare Pages and Wrangler deployment
├── supabase/                    # Browser, server, and middleware clients
├── redis.ts                     # Upstash cache and circuit breaker
├── versions.ts                  # Snapshot and restore implementation
├── dashboard.ts                 # Dashboard queries and reports data
├── career-email.ts              # Career email and notification delivery
├── contact-email.ts             # Contact email delivery
├── report-pdf.ts                # PDF report generation
└── notifications.ts             # Notification storage and read state

supabase/migrations/              # Database schema and RLS migrations
public/                          # Static public assets
scripts/                         # Repository utility scripts
tests/                           # Playwright and integration test suites
```

## Installation and Setup

### Prerequisites

- Node.js 20 or later
- npm
- A Supabase project
- A Google Gemini API key
- A Cloudflare account and API token for deployments
- Optional: an Upstash Redis database and a Resend account

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd chat2deploy
```

### 2. Install dependencies

```bash
npm ci
```

### 3. Configure Supabase

1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Apply `supabase/migrations/001_initial_schema.sql` first.
4. Apply migrations `002` through `009` in numerical order.

For an existing database, migrations add deployment, version, career, notification, and analytics fields without replacing earlier schema.

### 4. Configure environment variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

GOOGLE_GENERATIVE_AI_API_KEY=your_primary_gemini_key
GOOGLE_GENERATIVE_AI_BACKUP1_API_KEY=
GOOGLE_GENERATIVE_AI_BACKUP2_API_KEY=

GEMINI_MODEL=gemini-3.5-flash
GEMINI_FALLBACK_MODEL=gemini-3.8-flash

CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

RESEND_API_KEY=
APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
CAREERS_ADMIN_EMAIL=
CAREERS_FROM_EMAIL=
CONTACT_ADMIN_EMAIL=
CONTACT_FROM_EMAIL=
```

Use placeholders only. Do not commit `.env.local` or real secrets.

### 5. Start development

```bash
npm run dev
```

Open `http://localhost:3000`.

### 6. Configure Supabase authentication

In the Supabase Auth settings:

- Enable email/password authentication.
- Allow `http://localhost:3000/**` during local development.
- Configure the production site URL and `/auth/callback` redirect URL before deploying.

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL used by browser and server clients | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable/anonymous key | Yes |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Primary Gemini API key | Yes for generation |
| `GOOGLE_GENERATIVE_AI_BACKUP1_API_KEY` through `BACKUP5` | Optional Gemini key pool entries for failover | No |
| `GEMINI_MODEL` | Primary Gemini model; defaults to `gemini-3.5-flash` | No |
| `GEMINI_FALLBACK_MODEL` | Fallback Gemini model; defaults to `gemini-3.8-flash` | No |
| `CLOUDFLARE_API_TOKEN` | Server-side Cloudflare API token with Pages permissions | Yes for deployment |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account identifier | Yes for deployment |
| `UPSTASH_REDIS_REST_URL` | Upstash REST endpoint | No |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token | No |
| `RESEND_API_KEY` | Resend API key for contact/career email | For email features |
| `APP_URL` | Application origin used in career email links | No |
| `NEXT_PUBLIC_APP_URL` | Public application origin fallback | No |
| `CAREERS_ADMIN_EMAIL` | Career admin recipient and admin authorization email | Career admin features |
| `CAREERS_FROM_EMAIL` | Verified sender address for career email | Career admin features |
| `CONTACT_ADMIN_EMAIL` | Contact-form recipient | Contact feature |
| `CONTACT_FROM_EMAIL` | Verified sender address for contact email | Contact feature |

Cloudflare credentials are server-side secrets. `NEXT_PUBLIC_CLOUDFLARE_*` fallbacks exist in the codebase, but prefer the non-public `CLOUDFLARE_*` variables.

## Usage Guide

### Register or log in

Create an account from `/register` or sign in from `/login`. The application also provides `/forgot-password` and `/reset-password` flows.

### Create a project

Open `/dashboard`, create a project, and enter a project name. The project opens in `/workspace/[projectId]`.

### Generate and preview

Enter a descriptive prompt in the chat panel. Include the site purpose, sections, brand style, colors, audience, and required interactions. The preview updates automatically after a successful generation.

### Modify and restore

Use a follow-up prompt to target existing content or behavior—for example, “Make the navigation sticky and add a pricing section.” Open Version History to view snapshots or restore an earlier version.

### Deploy

Choose **Deploy** in the workspace when generated files are present. Successful deployments display the live URL and deployment metadata.

## API Documentation

All API routes run through Next.js Route Handlers. Mutation and private read endpoints require an authenticated Supabase session unless otherwise stated.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/projects` | Create a project |
| `GET` | `/api/projects` | List the authenticated user's projects |
| `PATCH` | `/api/projects/[projectId]` | Rename or update a project |
| `DELETE` | `/api/projects/[projectId]` | Delete a project |
| `POST` | `/api/generate` | Generate or modify a project's static files |
| `GET` | `/api/preview/[projectId]/[...path]` | Serve a stored project file for preview |
| `POST` | `/api/deploy` | Deploy project files to Cloudflare Pages |
| `GET` | `/api/deployments` | List deployment records |
| `POST` | `/api/deployments/remove` | Remove/unpublish a deployment |
| `GET` | `/api/versions?projectId=<id>` | List project version snapshots |
| `GET` | `/api/versions/[versionNumber]?projectId=<id>` | Retrieve a specific version |
| `POST` | `/api/versions/restore` | Restore a snapshot and create a rollback version |
| `GET` | `/api/dashboard/stats` | Get dashboard metrics |
| `GET` | `/api/dashboard/report` | Download a PDF analytics report |
| `POST` | `/api/dashboard/purge` | Purge Redis cache entries for the user |
| `GET` | `/api/notifications` | Retrieve in-app notifications |
| `POST` | `/api/notifications/mark-all-read` | Mark notifications as read |
| `PATCH` | `/api/notifications/[id]/read` | Mark one notification as read |
| `POST` | `/api/contact` | Submit a contact form |
| `POST` | `/api/careers/apply` | Submit a career application |
| `GET` | `/api/my-applications` | Retrieve the user's career applications |

## Deployment Guide

### Deploy Ansar AI itself

Ansar AI is a standard Next.js application and can be deployed to a platform that supports the Next.js runtime.

1. Import the repository into the hosting platform.
2. Set the environment variables listed above.
3. Use `npm ci` for dependency installation.
4. Use `npm run build` for the production build.
5. Set the public Supabase URL and authentication redirects for the production domain.
6. Configure Cloudflare and Resend values on the server, not in client-exposed variables.

### Deploy a generated website

The generated-site deployment flow is separate from deploying the Ansar AI application:

1. The deploy API validates the user and project ownership.
2. Stored files are checked for an `index.html` entry point.
3. File paths are checked to prevent absolute paths and traversal.
4. Wrangler creates or updates the Cloudflare Pages project.
5. The static files are uploaded directly to Pages.
6. The resulting URL and source version are saved in Supabase.

## Security Considerations

- Keep Gemini, Cloudflare, Resend, Supabase service credentials, and Upstash tokens in server-side environment variables.
- Supabase RLS protects projects, files, chats, versions, deployments, and profiles for each authenticated user.
- API routes verify authentication and project ownership for generation, deployment, versions, and project mutations.
- Career application RLS prevents public direct reads of applicant PII.
- The AI API returns sanitized Gemini error messages rather than exposing provider keys or stack traces.
- Static deployment validates `index.html`, rejects absolute paths, and blocks normalized traversal paths.
- Cache keys are scoped by user or project identifiers.
- Redis is optional in the current implementation and fails open to Supabase if unavailable.

## Troubleshooting

| Symptom | Likely cause | Action |
|---|---|---|
| Missing Supabase environment error | Required URL or anon key is absent | Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Login or redirect loops | Invalid Auth URL configuration | Add correct local/production URLs and `/auth/callback` redirects in Supabase |
| No AI response | Gemini key missing or quota/rate limit reached | Configure `GOOGLE_GENERATIVE_AI_API_KEY`; add backup keys if needed |
| Generation timeout or fallback | Model unavailable or request exceeded retry budget | Verify model names and try again; inspect server logs |
| Deployment says no files | Project has not generated successfully | Generate a site before deploying |
| Missing `index.html` | AI output did not provide an entry file | Retry generation or restore a valid version |
| Cloudflare credential error | Token or account ID missing/invalid | Configure server-side Cloudflare variables with Pages permissions |
| Cloudflare project collision | Project name is already used or invalid | Ansar AI sanitizes names and can add a fallback suffix |
| Redis cache warning | Redis credentials missing or provider unavailable | This is non-fatal; the app falls back to Supabase |
| Missing database tables | Supabase migrations were not applied | Apply migrations `001` through `009` in order |
| Build or dependency failure | npm state or Node version mismatch | Use Node 20+, remove stale installs, and run `npm ci` |

## Testing

The repository includes Playwright configuration and test suites for deployment, versions, resilience, integration, and website behavior.

```bash
npx playwright test
```

Useful targeted commands:

```bash
npm run lint
npm run build
npm run start
```

The Playwright configuration starts `npm run dev` on `http://localhost:3000` unless a server is already running outside CI.

## Roadmap

### Completed

- [x] Supabase authentication and protected routes
- [x] Prompt-based Gemini website generation
- [x] Existing-project modification prompts
- [x] Live desktop, tablet, and mobile previews
- [x] Cloudflare Pages deployment
- [x] Project, chat, file, and deployment persistence
- [x] Automatic version snapshots and rollback
- [x] Dashboard metrics and PDF reports
- [x] Upstash Redis caching with fail-open resilience
- [x] Contact and career application workflows
- [x] Dark and light themes

### Potential improvements

- [ ] Additional AI provider support
- [ ] Custom domains for deployed projects
- [ ] Deployed-site status checks and uptime monitoring
- [ ] Distributed Redis-backed application rate limiting
- [ ] Team collaboration and shared workspaces
- [ ] Import/export of generated project files
- [ ] Screenshot-based visual previews in README and onboarding
- [ ] Automated preview deployments for pull requests

## Contributing

1. Fork the repository.
2. Create a descriptive feature branch.
3. Implement the change without exposing secrets or credentials.
4. Run `npm run lint`, `npm run build`, and relevant tests.
5. Submit a pull request with implementation and testing details.

## License

No license file is currently present in the repository. A license has not been assumed. Add an appropriate `LICENSE` file before distributing the project publicly as open source.

## Contact and Support

Use the application's **Contact** page for project feedback and support, or open a repository issue if the project is hosted on GitHub.
