# SolarOps — Session Progress

**Last Updated:** 2026-03-19
**Repo:** https://github.com/IgorLipo/Manta-App-website-builder-setup
**Branch:** main
**Last Commit:** a20e544 `feat: complete scaffold across all 3 apps`

---

## Current State

The user asked to build a real UK solar operations platform (mobile app + admin portal + backend) using the /website-builder-setup skill. Significant work was done, then the user made direct edits via a linter/agent that modified core auth files to use **Clerk** instead of custom JWT. These edits are UNCOMMITTED locally.

---

## UNCOMMITTED LOCAL CHANGES (must be pushed)

These files were modified by the user's agent/linter and need to be committed:

```
M backend/prisma/schema.prisma
M backend/src/auth/auth.controller.ts
M backend/src/auth/auth.module.ts
M backend/src/auth/auth.service.ts
M backend/src/auth/guards/jwt-auth.guard.ts
M backend/src/auth/guards/roles.guard.ts
M backend/src/users/users.controller.ts
M backend/src/users/users.module.ts
M backend/src/users/users.service.ts
?? backend/src/auth/clerk/         (new - ClerkStrategy + ClerkService)
?? backend/src/users/entities/     (new - user entity)
```

**Key changes made by linter:**
- Auth now uses **Clerk** (`ClerkStrategy`, `ClerkService`) instead of custom JWT
- `JwtAuthGuard` now extends `AuthGuard('clerk')` not `AuthGuard('jwt')`
- `Role` enum moved to `src/common/enums/role.enum`
- `UsersService` now has `findOrCreateUser(clerkUser)` and `findByClerkId()`
- `AuthController` has Clerk webhook + callback endpoints
- `UsersModule` now imports `PrismaModule` directly

---

## What's Built

### Backend (`solar-ops/backend/`) — ~90 files
- **Auth** — Clerk-based (clerk.strategy.ts, clerk.service.ts, jwt-auth.guard.ts, roles.guard.ts)
- **Users** — CRUD via Clerk, findOrCreateUser pattern
- **Jobs** — 22-state workflow engine, ACL guards
- **Quotes** — submit/revise/approve workflow
- **Scheduling** — propose/confirm/reschedule
- **Notifications** — template-driven
- **Reports** — site report + PDF generation
- **Files** — S3 presigned URLs
- **Regions** — CRUD
- **Scaffolders** — CRUD with region mapping
- **Prisma schema** — 22 tables, all relations

### Admin Portal (`solar-ops/apps/admin/`) — Next.js 14
- Design system: #059669 primary (green), Tailwind CSS
- UI components: Button, Card, Badge, Dialog, Select, Tabs, Sheet, Toast, DataTable, Skeleton, Avatar, Progress, cn utility
- Pages: Dashboard (KPI + kanban + jobs table), Jobs list/detail, Login
- Layout with sidebar + Toaster

### Mobile App (`solar-ops/apps/mobile/`) — Expo (React Native)
- Role-select landing screen
- Auth: login, forgot-password, magic-link
- Owner flow: job list, photo submission wizard (4-step: guide → location → camera → review)
- Scaffolder flow: job list with priority indicators
- Engineer flow: report list
- Components: PhotoCapture, Timeline, SignaturePad, StatusBadge, JobCard

---

## Pending Commits to Push

```bash
cd solar-ops
git add -A
git commit -m "refactor: switch auth to Clerk, add findOrCreateUser pattern"
git push origin main
```

---

## To Resume After /clear

### 1. Fix and commit the uncommitted changes first (above)

### 2. Then continue with:

**Backend remaining:**
- [ ] `backend/src/main.ts` uses `SentryFilter` + simplified bootstrap — verify it works with Clerk
- [ ] `backend/tsconfig.json` stripped to minimal config — verify decorator paths work
- [ ] Add NestJS deps to package.json: `@nestjs/throttler`, `bullmq`, `nodemailer`, `firebase-admin`, `@prisma/client`, `passport`, `passport-jwt`, `date-fns`
- [ ] Verify `app.module.ts` imports all modules correctly
- [ ] Run `prisma generate` and `prisma migrate dev`
- [ ] Seed database with demo users

**Admin remaining:**
- [ ] Scaffolders management page
- [ ] Regions page
- [ ] Audit log page
- [ ] Analytics page
- [ ] Settings page
- [ ] Notifications center

**Mobile remaining:**
- [ ] Engineer site report form (`app/engineer/report.tsx`)
- [ ] Scaffolder schedule view (`app/scaffolder/schedule.tsx`)
- [ ] Wire up all API calls (currently mock data)
- [ ] Add expo-camera, expo-location, expo-notifications permissions

---

## Key File Locations

| File | Purpose |
|------|---------|
| `backend/prisma/schema.prisma` | Full data model |
| `backend/src/auth/clerk/` | Clerk strategy + service |
| `backend/src/auth/guards/jwt-auth.guard.ts` | Clerk auth guard |
| `backend/src/jobs/jobs.service.ts` | 22-state workflow engine |
| `backend/src/reports/pdf.service.ts` | PDF generation stub |
| `apps/admin/src/app/page.tsx` | Admin dashboard |
| `apps/mobile/app/owner/submit.tsx` | Owner photo wizard |
| `docker-compose.yml` | PostgreSQL + Redis |

---

## Commands to Run

```bash
# Fix npm cache
sudo chown -R 501:20 ~/.npm

# Backend
cd backend && npm install
cp .env.example .env.local   # add DATABASE_URL, CLERK_SECRET_KEY, etc.
docker-compose up -d
npm run db:generate && npm run db:migrate
npm run dev   # port 3001

# Admin
cd apps/admin && npm install && npm run dev   # port 3000

# Mobile
cd apps/mobile && npm install
npx expo prebuild && npx expo run:ios
```

---

## Design System (from linter updates)

- Primary: `#059669` (green)
- Primary Light: `#10b981`
- Accent: `#F97316` (orange)
- Background: `#F8FAFC`
- Text: `#0F172A`
- Muted: `#475569`
- Border: `#E2E8F0`
