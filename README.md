# Varsity Nest — Developer Onboarding

## Overview
Varsity Nest is a Next.js 15 application for student accommodation discovery and provider management. It includes server-side routed pages, authenticated student, provider and admin dashboards, wishlist functionality, profile management, payments via PayFast, analytics, and strong security and performance defaults.

- Framework: Next.js 15 - App Router
- Language: TypeScript
- UI: Tailwind CSS, shadcn/ui-based primitives, Lucide icons
- Auth: StackAuth (`@stackframe/stack`)
- DB: Neon/Postgres via Drizzle (`neon-http`), plus a secure DB layer
- Queue/Cache/OTP: Upstash Redis (REST)
- Media: Cloudinary
- Payments: PayFast (Instant Transaction Notification supported)
- Observability: Sentry

## Monorepo / Tooling
- Package manager: pnpm
- Linting/Types: ESLint + TypeScript (strict build, errors fail build)
- Formatting: Prettier (via ESLint configs)

## Project Structure
- `app/` — Next.js routes (server and client components)
  - `app/api/` — Route handlers (REST-like)
    - `app/api/student/` — Student-specific APIs (profile, settings, wishlist, profile-image)
  - `app/auth/` — Login, register, redirects
  - `app/student/` — Student dashboard (profile, settings, wishlist)
  - `app/provider/` — Provider dashboard/billing
  - `app/admin/` — Admin dashboards (analytics, domains, students, reports)
  - `app/listing/[id]/` — Listing details
- `components/` — UI and feature components (`ui/` contains primitives)
  - `components/StudentAuthProvider.tsx` — Student auth context provider
  - `components/StudentAuthSection.tsx` — Student auth UI section
  - `components/StudentProfileDropdown.tsx` — Student profile dropdown
  - `components/ProfileImageUpload.tsx` — Profile image upload component
- `hooks/` — Custom React hooks
  - `hooks/useStudentAuth.ts` — Student authentication hook
- `lib/` — Core services, auth, database, payments, caching, schemas
- `database/` — SQL schema and indexes
- `scripts/` — Setup/migrations/seed utilities
- `public/` — Static assets
- `styles/` — Global styles (Tailwind)

## Environment Variables
Create `.env.local` (never commit). All variables are validated at startup in `lib/env.ts` and `lib/env.client.ts`.

### Server (required)
- `NODE_ENV` — `development` | `production` | `test`
- `NEXT_PUBLIC_APP_URL` — Public app base URL (e.g., https://www.varsitynest.space)
- `DATABASE_URL` — Neon Postgres connection string
- `UPSTASH_REDIS_REST_URL` (or `KV_REST_API_URL`)
- `UPSTASH_REDIS_REST_TOKEN` (or `KV_REST_API_TOKEN`)
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `RESEND_API_KEY`
- `NEXTAUTH_SECRET`
- `STACK_SECRET_SERVER_KEY` (or `STACK_SECRET`)
- `PAYFAST_MERCHANT_ID`
- `PAYFAST_MERCHANT_KEY`
- `PAYFAST_PASSPHRASE`
- `RECAPTCHA_SECRET_KEY`
- `SENTRY_DSN` (required in production)
- `ALLOWED_ORIGINS` (comma-separated, required in production)

### Client/Public (required)
- `NEXT_PUBLIC_STACK_PROJECT_ID`
- `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
- `NEXT_PUBLIC_GA_ID` (optional)

## Install & Run
```bash
pnpm install
pnpm dev
```
- Local dev: `http://localhost:3000`
- Build: `pnpm build` (TypeScript and ESLint errors fail build by design)

## Authentication & Session
- StackAuth is initialized in `lib/stack.ts` via `getStackClientApp()` and `getStackServerApp()` singletons.
- Server-side session resolution in `lib/stackauth.ts` (`getSession`, `getCurrentUser`).
- Student authentication via `hooks/useStudentAuth.ts` with profile management and wishlist integration.
- App routes can guard via `components/AuthGuard.tsx` and role checks.
- Handler page: `app/handler/[...stack]/page.tsx` uses Stack handler with `{ fullPage: true }`.

## Database Access Patterns
- Primary SQL via Neon (`lib/database.ts`):
  - `getSQL()` returns a tagged-template function (raw query)
  - `query` utility wraps execution and returns `{ rows, rowCount }`
  - `getDB()` provides Drizzle instance with `lib/schema.ts`
- Secure DB layer: `lib/database-secure.ts` exposes `secureDb` with parameterized helpers.
- Migrations/seed: see `scripts/` and `database/schema.sql`.

## Payments (PayFast)
- Payment creation/signature: `lib/payfast.ts` (`createPayFastPayment`, `generatePayFastSignature`)
- ITN verification (server-to-server): `verifyPayFastITNWithServer`
- Notify route handler: `app/api/payfast/notify/route.ts`
- Ensure `NEXT_PUBLIC_APP_URL` is set correctly for return/cancel/notify URLs.

## Caching & OTP (Redis)
- Upstash Redis client in `lib/redis.ts` (singleton)
- OTP helpers: `storeOTP`, `getOTP`, `deleteOTP`, attempts tracking

## File Uploads (Cloudinary)
- Facade in `lib/cloudinary.ts` with secure wrappers:
  - `uploadImageSecurely`, `uploadDocumentSecurely`, `uploadImageFromBase64`
  - Security/validation services in `lib/services/*` and `lib/middleware/file-upload.ts`
  - Profile image uploads with automatic transformations and security tags

## Student System Features
- **Profile Management**: Complete student profile with image uploads, academic info, emergency contacts
- **Wishlist Functionality**: Heart button integration on accommodation cards, wishlist page with search/filter
- **Settings & Preferences**: Notification preferences, privacy settings, profile visibility controls
- **Authentication**: Student-specific auth hook with session management and role-based access
- **Database Integration**: Proper foreign key relationships between users, students, and wishlist tables
- **API Endpoints**: RESTful APIs for profile, settings, wishlist, and profile image management
- **UI Components**: Reusable components for student auth, profile management, and wishlist integration

## Observability
- Sentry initialized in `lib/sentry.ts`
- Errors captured in various services (Cloudinary upload/delete, DB, PayFast ITN)

## Code Style & Practices
- Strict typing in exported APIs; avoid `any` for new code
- One-line, past-tense comments where comments are required
- Avoid inline comments; prefer succinct docstrings
- Use guard clauses and avoid deep nesting
- Follow Tailwind atomic class usage; keep components small

## Common Commands
- Type check all: `pnpm exec tsc --noEmit`
- Lint: `pnpm lint`
- Start dev: `pnpm dev`
- Build: `pnpm build`

## Deployment Notes
- Next.js build is configured to fail on ESLint and TypeScript errors (`next.config.mjs`).
- Vercel-compatible. Ensure all env vars are configured in the Vercel project.
- Image domains configured in Next: `res.cloudinary.com`, `images.unsplash.com`.

## Key App Areas
- **Student**: `app/student/*` (profile management, settings, wishlist, dashboard)
  - Profile management with image uploads via Cloudinary
  - Settings for notifications and privacy preferences
  - Wishlist functionality with heart button integration
  - Student-specific authentication and session management
- **Admin**: `app/admin/*` (analytics, domains, reports, students)
- **Provider**: `app/provider/*` (accommodations, billing, dashboard)
- **Public**: `app/page.tsx`, `app/listing/[id]` (accommodation discovery with wishlist)
- **API**: `app/api/*` (auth, admin, provider, student, payfast, docs)

## Gotchas & Tips
- Params in Next.js 15 can be Promises in route/page handlers; await them before destructuring.
- Replace `<img>` with Next `<Image>` and provide width/height or `fill`.
- Escape unescaped entities in JSX (`&apos;`, `&quot;`) to satisfy ESLint.
- DayPicker custom components (`components/ui/calendar.tsx`) may require prop spreading rather than typed `onClick`.
- When adding admin routes, authorization checks should use `session.user.role`.
- Student authentication requires proper foreign key relationships between `users` and `students` tables.
- Wishlist functionality uses `students.id` (not `users.id`) for foreign key constraints.
- Student components should be wrapped in `StudentAuthProvider` for proper Suspense boundaries.

## Security Defaults
- CORS headers set in `next.config.mjs` for `/api/*`
- Sane security headers on all routes
- File uploads validated and can be quarantined
- OTP attempts are rate-limited via Redis

## Where To Start (New Contributor)
1. Clone and `pnpm install`
2. Ask me for the env vars
3. Run `pnpm dev`
4. Review `lib/stackauth.ts` and `lib/database.ts`
5. Explore routes in `app/` and components in `components/`
6. For DB: inspect `database/schema.sql` and `lib/schema.ts`
7. For student features: check `hooks/useStudentAuth.ts` and `app/student/*`
8. For wishlist: examine `components/AccommodationCard.tsx` and `app/api/student/wishlist/`

