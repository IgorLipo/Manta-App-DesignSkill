# Solar Ops — UK Solar Installation Platform

A production-grade mobile-first platform for solar installation operations management.

## What's Built

```
solar-ops/
├── backend/          # NestJS API (PostgreSQL + Prisma)
├── apps/
│   ├── admin/       # Next.js 14 Admin Portal
│   └── mobile/      # Expo React Native App
└── docker-compose.yml
```

## Quick Start

### 1. Fix NPM cache (if you hit permission errors)
```bash
sudo chown -R 501:20 ~/.npm
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env.local   # Edit with your values
docker-compose up -d         # Start PostgreSQL + Redis
npm run db:migrate
npm run dev                  # http://localhost:3001
```

### 3. Admin Portal
```bash
cd apps/admin
npm install
npm run dev                  # http://localhost:3000
```

### 4. Mobile App
```bash
cd apps/mobile
npm install
npx expo install            # Install Expo managed deps
npx expo prebuild           # Generate native projects
npx expo run:ios            # or run:android
```

## Architecture

### Backend (NestJS)
- JWT auth with refresh tokens
- Role-based access (ADMIN, OWNER, SCAFFOLDER, ENGINEER)
- 22-table Prisma schema with full audit logging
- S3 file upload with review workflow
- BullMQ-ready job queues
- FCM push notification stubs

### Admin Portal (Next.js 14)
- Dashboard with job pipeline view
- Job management with photo review
- Scaffolder assignment
- Quote review
- ICS calendar export

### Mobile App (Expo)
- Role-based entry (Owner / Scaffolder / Engineer / Admin)
- Owner: Guided photo submission with camera + location
- Scaffolder: Job list, quote submission
- Engineer: Site report form
- Deep links, push notifications ready

### Workflow Engine
22-state job lifecycle with guarded transitions:
```
DRAFT → AWAITING_OWNER_SUBMISSION → SUBMITTED → VALIDATED
→ ASSIGNED_TO_SCAFFOLDER → QUOTE_SUBMITTED → QUOTE_APPROVED
→ SCHEDULING_IN_PROGRESS → SCHEDULED → SCAFFOLD_WORK_IN_PROGRESS
→ SCAFFOLD_COMPLETE → SITE_REPORT_PENDING → SITE_REPORT_SUBMITTED
→ COMPLETED
```

## MVP Status

✅ Backend: Full NestJS API with auth, jobs, files, scheduling, reports
✅ Prisma schema: 22 models, complete relations, audit logging
✅ Admin portal: Dashboard scaffold, job list, photo review
✅ Mobile app: Role select, owner photo submission flow, scaffolder job list
❌ Firebase FCM (stub — needs account setup)
❌ PDF generation (stub — needs Puppeteer integration)
❌ Email (stub — needs Resend/SendGrid integration)
❌ EAS Build (needs Expo account + eas.json)
❌ Production deployment (needs AWS/Vercel/Railway setup)

## Next Steps

1. Fix NPM cache: `sudo chown -R 501:20 ~/.npm`
2. Run `npm install` in each subdirectory
3. Start PostgreSQL: `docker-compose up -d`
4. Create `.env.local` from `.env.example` with real credentials
5. Run `npm run db:migrate` in backend
6. Create an admin user via seed script or API
