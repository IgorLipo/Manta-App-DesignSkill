# SolarOps — Production Architecture & Implementation Blueprint

**Version:** 1.0 | **Date:** 2026-03-19 | **Status:** Production-Ready Specification

---

## 1. PRODUCT ARCHITECTURE OVERVIEW

### System Topology

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │  iOS App │  │Android App│  │  Admin Portal (Web)  │   │
│  │React Native│ │React Native│  │     Next.js          │   │
│  │  + Expo  │  │  + Expo   │  │                       │   │
│  └────┬─────┘  └────┬─────┘  └──────────┬───────────┘   │
└───────┼─────────────┼───────────────────┼───────────────┘
        │             │                   │
        ▼             ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│                   API GATEWAY LAYER                      │
│            NestJS REST API / GraphQL (hybrid)           │
│  Auth │ Jobs │ Photos │ Quotes │ Schedules │ Reports     │
└─────────────────────────┬───────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌───────────────┐  ┌─────────────┐  ┌────────────────────┐
│  PostgreSQL   │  │    Redis    │  │    AWS S3 / R2     │
│   (Prisma)    │  │  (BullMQ)   │  │  (File Storage)    │
└───────────────┘  └─────────────┘  └────────────────────┘
                          │
                    ┌─────┴─────┐
                    ▼           ▼
              ┌──────────┐ ┌──────────┐
              │ Firebase │ │  SendGrid│
              │  FCM     │ │  / SES   │
              │(Push)    │ │ (Email)  │
              └──────────┘ └──────────┘
```

### Architecture Principles

1. **API-First** — All mobile and web clients communicate via a single REST/GraphQL API
2. **Modular Monolith** — NestJS modules per domain (Auth, Jobs, Photos, Quotes, Scheduling, Reports, Notifications)
3. **Single Source of Truth** — PostgreSQL via Prisma; no client-side data duplication
4. **Async Workers** — BullMQ handles emails, PDF generation, push notifications
5. **File Storage** — All photos/PDFs stored in S3/R2 with signed URLs; never exposed directly
6. **Multi-Tenant Ready** — `companyId` on all tenant-scoped entities (Phase 2)

---

## 2. RECOMMENDED TECH STACK WITH RATIONALE

### Mobile Apps

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **React Native 0.76+ with Expo SDK 52** | Mature RN with New Architecture; Expo EAS handles builds without Mac; supports bare workflow for native modules |
| Language | **TypeScript 5.x** | Required for Prisma client, NestJS shared types, strict null checking |
| State Management | **Zustand** + **React Query (TanStack Query)** | Zustand for UI state; React Query for server state, caching, optimistic updates |
| Navigation | **Expo Router v4** | File-based routing; deep link support built-in |
| Forms | **Zod** + **React Hook Form** | Schema validation shared with backend; type inference end-to-end |
| Camera/Photos | **expo-image-picker** + **expo-camera** | Permission handling, compression built-in |
| Maps | **react-native-maps** + **Mapbox** | Google Maps on Android, Mapbox on iOS (Mapbox is free tier friendly) |
| Push Notifications | **Expo Notifications** | Abstracts FCM/APNs; handles background/foreground states |
| Storage | **expo-secure-store** | JWT refresh token storage |
| Networking | **Axios** + **ky** | Axios for REST; ky for file uploads with progress |

### Admin Portal

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **Next.js 14 App Router** | Server components, RSC, built-in auth with NextAuth.js, API routes |
| Language | **TypeScript 5.x** | Share Zod schemas with mobile and API |
| UI Library | **shadcn/ui** + **Radix UI** | Accessible, composable, themeable — not a component dump |
| Styling | **Tailwind CSS v4** | Rapid iteration; CSS variables for theming |
| Tables | **TanStack Table** | Headless, fully typed, pagination/filtering/sorting |
| Charts | **Recharts** | Works with React; consistent with mobile design system |
| Forms | **Zod** + **React Hook Form** as above |
| Auth | **NextAuth.js v5 (Auth.js)** | Supports credentials + magic link; session strategy JWT |
| File Upload | **react-dropzone** + **tus-js-client** | Resumable uploads for large photos |

### Backend API

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **NestJS 10** | Modular, decorator-based DI, guards for RBAC, pipes for validation |
| Language | **TypeScript 5.x** | One language end-to-end |
| ORM | **Prisma 5** | Type-safe, migrations, excellent DX, raw query support |
| Database | **PostgreSQL 16** | JSONB for flexible fields (metadata), full-text search via pg_trgm |
| Validation | **class-validator** + **Zod** | Zod schemas auto-generated from Prisma for API contracts |
| Auth | **Access Token (JWT, 15min) + Refresh Token (JWT, 7d, stored in DB)** | Standard; refresh token rotation; brute-force protected |
| Queue | **BullMQ 5** | Redis-based; job priorities; retries; scheduling |
| PDF | **Puppeteer** (server-side Chrome) + **react-pdf** for templating | Headless Chrome renders HTML template to PDF |
| File Processing | **Sharp** | Server-side image compression before S3 upload |
| File Storage | **AWS S3** (or Cloudflare R2 for S3-compatible cheaper egress) | Presigned URLs; lifecycle policies |
| Email | **SendGrid** | Transactional email; templates; delivery tracking |
| Push | **Firebase Admin SDK** | FCM for iOS/Android push; topic-based routing |
| Logging | **Pino** | Structured JSON logs; performance overhead ~0.5ms |
| Monitoring | **Sentry** | Error tracking, performance monitoring, session replay (opt-in) |
| Rate Limiting | **@nestjs/throttler** | per-user, per-IP, per-route limits |

### Infrastructure

| Layer | Choice | Rationale |
|-------|--------|-----------|
| IaC | **Terraform** or **Pulumi** | Cloud-agnostic; state management; reproducibility |
| Containers | **Docker** | Consistent dev/prod; multi-stage builds |
| Orchestration | **AWS ECS Fargate** (or EKS for more control) | Serverless containers; no EC2 management |
| CDN | **CloudFront** | S3 origin; global edge; signed URLs |
| DNS | **Route 53** | Latency routing; health checks |
| Secrets | **AWS Secrets Manager** | Rotation; audit; injection via env |
| CI/CD | **GitHub Actions** | Native; matrix builds; self-hosted runners for Mac (iOS) |
| Environments | **3: dev, staging, production** | Isolated; staging mirrors prod config |

---

## 3. USER ROLES AND PERMISSIONS MATRIX

### Roles

| Role ID | Name | Description |
|---------|------|-------------|
| `ADMIN` | Admin | Internal operations manager |
| `OWNER` | Property Owner | System owner / landlord / property owner |
| `SCAFFOLDER` | Scaffolder | Contractor who erects scaffolding |
| `ENGINEER` | Engineer/Installer | Solar panel installer / field engineer |

### Permissions

| Permission | ADMIN | OWNER | SCAFFOLDER | ENGINEER |
|-----------|-------|-------|-----------|---------|
| `jobs:create` | ✓ | — | — | — |
| `jobs:read:all` | ✓ | — | — | — |
| `jobs:read:owned` | — | ✓ | — | — |
| `jobs:read:assigned` | — | — | ✓ | ✓ |
| `jobs:update:status` | ✓ | — | — | — |
| `jobs:update:assign` | ✓ | — | — | — |
| `jobs:delete` | ✓ | — | — | — |
| `photos:upload:own` | — | ✓ | ✓ | ✓ |
| `photos:review` | ✓ | — | — | — |
| `photos:approve` | ✓ | — | — | — |
| `photos:reject` | ✓ | — | — | — |
| `quotes:submit` | — | — | ✓ | — |
| `quotes:review` | ✓ | — | — | — |
| `quotes:approve` | ✓ | — | — | — |
| `quotes:reject` | ✓ | — | — | — |
| `schedules:create` | ✓ | — | — | — |
| `schedules:respond` | — | ✓ | ✓ | ✓ |
| `schedules:view:all` | ✓ | — | — | — |
| `reports:submit` | — | — | — | ✓ |
| `reports:view:all` | ✓ | — | — | — |
| `reports:view:own` | — | ✓ | — | — |
| `users:manage` | ✓ | — | — | — |
| `scaffolders:manage` | ✓ | — | — | — |
| `regions:manage` | ✓ | — | — | — |
| `audit:read` | ✓ | — | — | — |
| `templates:manage` | ✓ | — | — | — |
| `notifications:manage` | ✓ | — | — | — |

### Object-Level Access Control (OACL)

- **Owner** can only access jobs where `job.ownerId === currentUser.id`
- **Scaffolder** can only access jobs where `job.assignments` includes `scaffolder.id`
- **Engineer** can only access jobs in `SCAFFOLD_COMPLETE` or later states assigned to them
- **Admin** has no restrictions

---

## 4. END-TO-END WORKFLOW MAP

```
[ADMIN]                               [SYSTEM]
  │                                     │
  │──Create Job─────────────────────────►│
  │                                     │
  │──Send Invitation Email to Owner────►│
  │                                     │
[OWNER]                           [EMAIL/PUSH]
  │                                     │
  │◄──Receives invite────────────────────┤
  │                                     │
  │──Login / Magic Link Auth───────────►│
  │                                     │
  │──Uploads photos + location──────────►│
  │   (guided step-by-step UI)           │
  │                                     │
[ADMIN]                                │
  │                                     │
  │◄──Review photos + location───────────┤
  │                                     │
  ├──[APPROVE]──Assign Scaffolder──────►│
  │   or                                 │
  ├──[REQUEST MORE INFO]──────────────►[OWNER] (loop)
  │   or                                 │
  └──[REJECT]─────────────────────────►│ (job cancelled)
                                         │
[SCAFFOLDER]                             │
  │                                     │
  ◄──Receives push: New Job Assigned────┤
  │                                     │
  │──Review site photos + details──────►│
  │                                     │
  │──Submit quote (amount, dates)──────►│
  │                                     │
[ADMIN]                                │
  │                                     │
  │◄──Review quote───────────────────────┤
  │                                     │
  ├──[APPROVE]──► SCHEDULING ──────────►│
  │   or                                 │
  ├──[REVISION]──► SCAFFOLDER (loop)     │
  │   or                                 │
  └──[REJECT]───────────────────────────►│
                                         │
  [SCHEDULING PHASE]                     │
  │                                     │
  │──Admin proposes dates──────────────►│
  │                                     │
  │◄──Owner confirms/changes────────────┤
  │                                     │
  │──Scaffolder confirms────────────────►│
  │                                     │
  │──Job moves to SCHEDULED─────────────►│
  │                                     │
  │──All parties notified (email+push)──┤
  │                                     │
  [SCAFFOLD WORK]                        │
  │                                     │
  │──Scaffolder marks WORK STARTED─────►│
  │                                     │
  │──Scaffolder marks WORK COMPLETE────►│
  │   (optional completion photos)        │
  │                                     │
  [INSTALLER PHASE]                      │
  │                                     │
  │──Admin assigns Engineer────────────►│
  │                                     │
  │──Engineer fills site report form──►│
  │   (guided questionnaire + photos)    │
  │                                     │
  │──PDF auto-generated────────────────►│
  │                                     │
  │──Admin reviews PDF─────────────────►│
  │                                     │
  │──COMPLETED ─────────────────────────►│
```

---

## 5. FULL DATA MODEL

### Entity Relationship Diagram (Conceptual)

```
User (1)──────(1)UserRole
  │                 │
  │                 ▼
  │           RolePermission
  │
 ├──(1)Property (1)──────(N)Job
 │        │                    │
 │        │                    ├──(N)JobStatusHistory
 │        │                    ├──(N)Photo
 │        │                    ├──(N)Comment
 │        │                    ├──(N)Notification
 │        │                    ├──(N)AuditLog
 │        │                    │
 │        │              Assignment (N:N via join)
 │        │                    │
 │        │              Scaffolder ──(N)Region (N:N)
 │        │                    │
 │        │              Quote (1)────(N)QuoteRevision
 │        │                    │
 │        │              Schedule (N)──(1)ScheduleResponse
 │        │                    │
 │        │              SiteReport (1)──(N)SiteReportPhoto
 │        │                    │
 │        │              GeneratedPDF (1)
 │
 └──(N)ConsentRecord
         │
         (N)AccountDeletionRequest
```

### Prisma Schema Entities

```prisma
// See Section 14 for full schema
```

### Core Entities

| Entity | Key Fields | Notes |
|--------|-----------|-------|
| `User` | id, email, passwordHash, role, companyId, emailVerified, mfaEnabled, createdAt | Soft delete via deletedAt |
| `ConsentRecord` | id, userId, consentType, grantedAt, ipAddress | GDPR consent tracking |
| `Property` | id, ownerId, address, lat, lng, createdAt | Owner is separate User |
| `Job` | id, propertyId, status, createdAt, updatedAt | State machine enforced |
| `JobStatusHistory` | id, jobId, fromStatus, toStatus, changedBy, notes | Immutable audit trail |
| `Photo` | id, jobId, uploadedBy, url, type, status, metadata | status: PENDING/APPROVED/REJECTED |
| `Assignment` | id, jobId, scaffolderId, assignedAt, assignedBy | Unique constraint (jobId, scaffolderId) |
| `Scaffolder` | id, userId, regionId, isActive | Linked to User |
| `Region` | id, name, description | UK regions |
| `ScaffolderRegion` | scaffolderId, regionId | N:N join table |
| `Quote` | id, jobId, scaffolderId, amount, currency, notes, status | status: PENDING/APPROVED/REJECTED/REVISION_REQUESTED |
| `QuoteRevision` | id, quoteId, amount, notes, createdAt | Full history |
| `Schedule` | id, jobId, proposedDate, proposedEndDate, status | status: PROPOSED/CONFIRMED/CHANGE_REQUESTED/CANCELLED |
| `ScheduleResponse` | id, scheduleId, userId, response, notes | OWNER/CONTRACTOR response |
| `SiteReport` | id, jobId, engineerId, status, answers (JSONB), draft | Dynamic form answers |
| `SiteReportPhoto` | id, siteReportId, photoId | Join table |
| `GeneratedPDF` | id, jobId, type, url, createdAt | CACHED_PDF per job per type |
| `Comment` | id, jobId, userId, body, createdAt | Threaded (parentId) |
| `Notification` | id, userId, jobId, templateId, read, sentAt | Template-driven |
| `NotificationTemplate` | id, event, channel, subject, body, variables | Admin-editable |
| `AuditLog` | id, userId, action, entityType, entityId, metadata | Immutable |
| `AccountDeletionRequest` | id, userId, requestedAt, processedAt, status | GDPR flow |
| `JobInvitation` | id, jobId, email, token, expiresAt, acceptedAt | Secure invite tokens |
| `RefreshToken` | id, userId, tokenHash, deviceInfo, expiresAt, revokedAt | Token rotation |
| `Session` | id, userId, refreshTokenId, ipAddress, userAgent, createdAt, expiresAt | Active sessions |
```

---

## 6. API STRUCTURE

### Recommendation: REST with OpenAPI 3.1

**Justification:** REST is well-understood, works with React Query natively, has superior tooling for mobile (axios, fetch), and GraphQL adds operational complexity (N+1, cost analysis, CDN caching) that this product doesn't need yet. We use OpenAPI 3.1 for contract-first development.

### API Modules

```
/api/v1
  /auth
    POST   /register
    POST   /login
    POST   /logout
    POST   /refresh
    POST   /forgot-password
    POST   /reset-password
    POST   /verify-email
    GET    /me
    PATCH  /me

  /jobs
    GET    /              (admin: list all; owner: own; scaffolder: assigned)
    POST   /              (admin only)
    GET    /:id
    PATCH  /:id
    DELETE /:id
    POST   /:id/invite    (send owner invitation)
    PATCH  /:id/status    (admin: transition state)
    GET    /:id/history   (status history)
    GET    /:id/timeline  (full audit + comments)

  /jobs/:id/photos
    GET    /
    POST   /              (multipart upload)
    PATCH  /:photoId      (admin: approve/reject)
    DELETE /:photoId      (owner/contractor: own photos only)

  /jobs/:id/quotes
    GET    /              (all quotes for job)
    POST   /              (scaffolder submit)
    PATCH  /:quoteId      (admin: approve/reject/request-revision)
    POST   /:quoteId/revisions (scaffolder: submit revision)

  /jobs/:id/schedules
    GET    /
    POST   /              (admin: propose dates)
    PATCH  /:scheduleId/respond (owner/scaffolder: respond)

  /jobs/:id/reports
    GET    /              (admin: view; engineer: own)
    POST   /              (engineer: submit)
    PATCH  /:reportId     (engineer: save draft)
    GET    /:reportId/pdf (download generated PDF)

  /jobs/:id/comments
    GET    /
    POST   /

  /users                    (admin only)
    GET    /
    POST   /
    PATCH  /:id
    DELETE /:id

  /scaffolders
    GET    /              (admin: list; with region filter)
    POST   /              (admin: create)
    PATCH  /:id           (admin: update regions, active status)

  /regions
    GET    /
    POST   /              (admin)
    PATCH  /:id
    DELETE /:id

  /notifications
    GET    /              (paginated, own notifications)
    PATCH  /:id/read
    PATCH  /read-all

  /notification-templates  (admin only)
    GET    /
    PATCH  /:id

  /admin
    GET    /dashboard     (aggregated metrics)
    GET    /audit-logs
    GET    /jobs          (extended filters: status, region, contractor, date range)
```

### Pagination & Filtering

- **Cursor-based pagination** for job lists (stable during concurrent updates)
- **Filter params:** `?status=VALIDATED&regionId=3&scaffolderId=7&from=2026-01-01&to=2026-03-31&search=SMITH`
- **Sort:** `?sort=createdAt&order=desc`

### Upload Strategy

```
Client ──POST /uploads/presign──► API
                          │
                          ▼
                    Generate S3 presigned PUT URL
                    (max 10MB, image/* only, 5min expiry)

Client ──PUT directly to S3 presigned URL──► S3
                      │
                      ▼
                S3 triggers webhook / EventBridge
                      │
                      ▼
                API receives event, creates Photo record
                      │
                      ▼
                BullMQ job: compress with Sharp → store compressed version
```

---

## 7. MOBILE APP INFORMATION ARCHITECTURE

### Stack: React Native + Expo Router

### Navigation Structure

```
Root (auth-aware)
├── (auth)
│   ├── /login
│   ├── /register
│   ├── /forgot-password
│   └── /magic-link/[token]
│
├── (owner)
│   ├── /owner
│   │   └── / (redirects to /owner/jobs)
│   ├── /owner/jobs
│   ├── /owner/jobs/:id
│   ├── /owner/jobs/:id/submit  (photo + location submission)
│   ├── /owner/jobs/:id/schedule (view + respond)
│   ├── /owner/notifications
│   └── /owner/profile
│
├── (scaffolder)
│   ├── /scaffolder
│   ├── /scaffolder/jobs
│   ├── /scaffolder/jobs/:id
│   ├── /scaffolder/jobs/:id/quote
│   ├── /scaffolder/jobs/:id/schedule
│   ├── /scaffolder/notifications
│   └── /scaffolder/profile
│
├── (engineer)
│   ├── /engineer
│   ├── /engineer/jobs
│   ├── /engineer/jobs/:id
│   ├── /engineer/jobs/:id/report
│   └── /engineer/profile
│
└── (admin)  [Admin web portal is Next.js, not in mobile app]
```

### Key Screens by Role

#### Owner Screens

1. **Splash + Auth** — Email/password; magic link fallback
2. **Onboarding** (first login) — Terms acceptance, notification permission, brief explainer
3. **Job List** — Card list: property address, status badge, last update
4. **Job Detail** — Status timeline, property info, photos, actions
5. **Submit Photos** — Step wizard:
   - Step 1: Exterior angles (camera capture, 4 required)
   - Step 2: Roof/panel side (camera capture, 2 required)
   - Step 3: Access constraints (camera, 1 min)
   - Step 4: Height/floors (camera + text option)
   - Step 5: Location (map pin or GPS)
   - Step 6: Review + submit
6. **More Info Request** — See what admin needs, re-upload
7. **Quote View** — See approved quote amount and details
8. **Schedule Response** — Calendar picker, confirm/reschedule/unavailable
9. **Notifications** — List with read/unread, tap to navigate
10. **Profile** — Name, email, notification preferences, logout

#### Scaffolder Screens

1. **Splash + Auth**
2. **Job List** — Assigned jobs; filter by status (Pending Quote, Scheduled, etc.)
3. **Job Detail** — Full info: property, owner, photos, map, requirements
4. **Submit Quote** — Amount input, date picker, notes/assumptions/exclusions
5. **Quote Status** — View pending/approved/rejected status
6. **Schedule View** — Proposed date, confirm/negotiate
7. **Mark Complete** — Button to mark scaffold work done; optional completion photos
8. **Notifications**
9. **Profile** — Availability settings, region preferences

#### Engineer Screens

1. **Splash + Auth**
2. **Job List** — Jobs assigned to them post-scaffold
3. **Job Detail** — Site context, scaffolding completion info
4. **Site Report Form** — Step wizard:
   - Section 1: Installation details (dropdowns, text)
   - Section 2: Panel condition (photos required)
   - Section 3: Electrical checks (yes/no toggles)
   - Section 4: Annotations / notes
   - Section 5: Signature (touch signature capture)
   - Step 6: Review + submit
5. **Report Drafts** — Auto-saved drafts
6. **Notifications**

---

## 8. ADMIN PORTAL INFORMATION ARCHITECTURE

### Next.js App Router Structure

```
/app
  (auth)
    /login
    /forgot-password

  (dashboard)
    /layout.tsx          (sidebar + header)
    /page.tsx            (overview dashboard)

  /jobs
    /page.tsx            (list with filters + kanban toggle)
    /[id]/page.tsx      (full job detail)
    /new/page.tsx       (create job + send invite)

  /jobs/[id]
    /photos/page.tsx    (photo review grid)
    /quotes/page.tsx    (quote review)
    /schedule/page.tsx  (schedule management)
    /reports/page.tsx   (site report viewer + PDF)

  /scaffolders
    /page.tsx           (list + region tags)
    /[id]/page.tsx

  /engineers
    /page.tsx

  /owners
    /page.tsx

  /regions
    /page.tsx           (CRUD regions + mapping)

  /notifications
    /page.tsx           (in-app notification list)
    /templates/page.tsx (edit email/push templates)

  /audit-log
    /page.tsx           (searchable audit trail)

  /analytics
    /page.tsx           (operational metrics dashboard)

  /settings
    /page.tsx           (company settings, workflow config)

  /users
    /page.tsx           (admin user management)
```

### Admin Dashboard Widgets

- **KPI Cards:** Open jobs, awaiting submission, awaiting review, scheduled this week, completed this month
- **Pipeline Kanban:** Jobs by status column (draggable for quick status updates)
- **Recent Activity Feed:** Latest actions across all jobs
- **Jobs Map:** Geographic view of active jobs
- **Time Metrics:** Avg. time per stage (submission→validation, validation→quote, etc.)

---

## 9. SECURITY ARCHITECTURE

### Authentication Flow

```
1. User submits email + password
2. Server validates credentials; checks brute-force counter (Redis)
3. If valid: generate access token (JWT, 15min) + refresh token (opaque, hashed in DB, 7d)
4. Return tokens to client
5. Client stores access in memory (Zustand); refresh in expo-secure-store
6. Client uses access token on all API requests
7. On 401: client calls /auth/refresh, server rotates refresh token (old invalidated)
8. Refresh token stored as hash in DB; enables brute-force detection and revocation
```

### MFA Architecture

- TOTP via `otplib` (Google Authenticator compatible)
- Backup codes (10, one-time use, hashed in DB)
- MFA enforced for Admin role; optional for others
- `mfaEnabled`, `mfaSecret`, `mfaBackupCodes` fields on User
- Step-up auth: certain actions (approve quote > £X, delete job) require re-authentication

### Password Security

- Bcrypt with cost factor 12 (adaptive)
- Password policy: min 8 chars, mixed case, number, not in breached password list (HaveIBeenPwned API check)
- Password change requires current password; forces re-auth on new device

### Session Management

- Max 5 active sessions per user; oldest invalidated on new login
- Session list viewable in profile; revoke individual sessions
- Inactive session expiry: 30 days (configurable)

### File Upload Security

- Presigned URLs (PUT only, no GET)
- File type validation: MIME type + magic bytes (Sharp + file-type package)
- Max file size: 10MB
- Images stripped of EXIF geolocation before storage (privacy)
- Virus scan via ClamAV (Lambda function triggered on S3 upload)
- Presigned URLs expire in 5 minutes

### Network Security

- TLS 1.3 enforced at load balancer
- Certificate via AWS ACM (auto-renewal)
- API only accessible via CloudFront (IP allowlist for admin webhook endpoints)
- CORS: restrict to known origins (mobile apps, admin domain)

### Secrets Management

- AWS Secrets Manager for all secrets
- env vars injected at container start via ECS task definition
- No secrets in code, not even encrypted
- Rotation: 90-day automatic rotation for DB credentials

### Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `POST /auth/login` | 5/min per IP |
| `POST /auth/register` | 3/min per IP |
| `POST /auth/refresh` | 10/min per user |
| `POST /uploads/presign` | 20/min per user |
| All other API | 100/min per user |

### Audit Logging

Every mutation (CREATE, UPDATE, DELETE) on core entities logged:

```json
{
  "id": "uuid",
  "userId": "uuid",
  "action": "UPDATE",
  "entityType": "Job",
  "entityId": "uuid",
  "metadata": { "field": "status", "from": "VALIDATED", "to": "ASSIGNED" },
  "ipAddress": "1.2.3.4",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2026-03-19T10:00:00Z"
}
```

Immutable (no UPDATE/DELETE on AuditLog table).

---

## 10. APP STORE / PLAY STORE READINESS CHECKLIST

### Pre-Submission Technical Checklist

#### iOS (Apple App Store)

- [ ] Bundle ID: `com.solarops.app` (or company domain)
- [ ] App Store Connect: create app record with correct bundle ID
- [ ] Capabilities: Push Notifications, Background Modes (fetch, remote-notification), Associated Domains (for universal links)
- [ ] Info.plist: camera (NSCameraUsageDescription), photo library (NSPhotoLibraryUsageDescription), location (NSLocationWhenInUseUsageDescription) — all with business justification strings
- [ ] Privacy manifest (PrivacyInfo.xcprivacy): tracked data categories declared
- [ ] Minimum iOS version: iOS 15.1 (Expo default is iOS 13)
- [ ] App Icon: 1024x1024 master + all required sizes (auto-generated by Expo)
- [ ] Splash screen: neutral branded splash (no flash of white)
- [ ] Build with EAS Build: `--local` for local Mac build or cloud build
- [ ] TestFlight: internal testing track live for at least 1 day before review submission
- [ ] Sign In with Apple: implemented if any social auth added (required by Apple if third-party login exists)
- [ ] Accessibility: VoiceOver labels on all interactive elements, dynamic type support

#### Android (Google Play)

- [ ] Package name: `com.solarops.app`
- [ ] Google Play Console: create app, upload AAB (Android App Bundle) from EAS build
- [ ] Permissions declared in AndroidManifest: `CAMERA`, `READ_EXTERNAL_STORAGE`, `ACCESS_FINE_LOCATION`, `POST_NOTIFICATIONS` (Android 13+)
- [ ] Privacy Policy URL hosted and linked in Play Console
- [ ] Data Safety form: declare all data collected (photos, location, email) and purpose
- [ ] Target SDK: 34 (Android 14), Min SDK: 24 (Android 7)
- [ ] App signing: Google Play App Signing (EAS handles this if using `--auto` profile)
- [ ] Screenshots: phone (1080x1920), tablet (optional), required for both portrait + landscape
- [ ] Feature graphic: 1024x500
- [ ] Privacy policy and terms of service URLs live

### Compliance Checklists

#### Apple App Store — Required Before Submit

| Item | Status | Notes |
|------|--------|-------|
| Privacy Policy URL | REQUIRED | Must be live before submission |
| Terms of Service | REQUIRED | Link in app + in metadata |
| Data collection disclosure | REQUIRED | App Tracking Transparency prompt if analytics used |
| Age rating (4+) | REQUIRED | Self-declare; solar/home context is age 4+ |
| Content rights | REQUIRED | Confirm you own all content |
| Location permission justification | REQUIRED | "We use your location to verify property address for scaffolding safety assessment" |
| Camera permission justification | REQUIRED | "We use the camera to take photos of your property for solar site assessment" |
| Push notification permission | REQUIRED | "We send push notifications to update you on your job status" |
| Background location | NOT REQUIRED | Don't request unless genuinely needed |
| Sign in with Apple (if applicable) | REQUIRED | If email/password auth only, still required if third-party login added |
| Demo account | REQUIRED | Provide test credentials in App Store Connect notes for reviewer |
| App preview video | RECOMMENDED | Show key workflows; 15-30 sec |

#### Google Play — Required Before Submit

| Item | Status | Notes |
|------|--------|-------|
| Privacy Policy URL | REQUIRED | Must be live before submission |
| Data Safety form | REQUIRED | Declare: photos (uploaded by user), location (approximate), email |
| Target audience + content rating | REQUIRED | Complete questionnaire; takes ~10 min |
| Ads declaration | REQUIRED | Declare "not an ad-app" |
| COVID-19 / sensitive health | N/A | Not applicable |
| App access during review | REQUIRED | Provide test credentials in Play Console |
| In-app purchases | N/A | No IAP in MVP |
| Amazon APS | N/A | Not applicable |

### Legal / Policy Items Requiring Review

- [ ] **Privacy Policy** — Must be drafted by a qualified UK/EU lawyer. Must cover: data controller identity, lawful basis (contract for owners, legitimate interest for contractors), data subject rights (access, erasure, portability, objection), retention periods, international transfers (if AWS EU region not used), DPA agreements
- [ ] **Terms of Service** — Must cover: acceptable use, intellectual property, limitation of liability, contractor classification (important for UK IR35), dispute resolution (UK courts)
- [ ] **Cookie Consent** — If web admin portal uses cookies; mobile apps don't need cookie banners
- [ ] **IR35 Assessment** — Scaffolders/contractors may be IR35-intermediate; consult accountant
- [ ] **GDPR Representative** — If processing EU data, need EU representative under Article 27
- [ ] **ICO Registration** — SolarOps as data processor may need to register with UK ICO (£35-50/year)

---

## 11. MVP SCOPE

### Included in MVP

**Mobile App (React Native + Expo)**
- Email/password auth + magic link login
- Role-based routing (Owner, Scaffolder, Engineer)
- Owner: job list, photo submission wizard (camera + gallery), location pin, status tracking
- Owner: schedule response (confirm/reschedule/unavailable)
- Scaffolder: assigned job list, quote submission (amount + notes + proposed date)
- Scaffolder: mark scaffold complete + optional completion photos
- Engineer: site report form (dynamic questionnaire, photo attachments)
- PDF generation + download/share for site reports
- Push notifications (FCM/APNs)
- In-app notifications center
- Notification preferences

**Admin Portal (Next.js)**
- Dashboard with key metrics
- Job list with filters (status, region, contractor) + kanban view
- Job detail: review photos, approve/reject/request-more-info, assign scaffolder
- Photo review: grid view, zoom, approve/reject with notes
- Quote review: approve/reject/request revision
- Schedule management: propose dates, view responses
- Site report viewer: view submitted reports + download PDF
- User management: create/edit/deactivate users
- Scaffolder management: CRUD + region tagging
- Region management: CRUD
- Audit log viewer: filterable by user, entity, action, date
- Notification template editor

**Backend (NestJS + PostgreSQL + Prisma)**
- Full auth: register, login, logout, refresh, forgot/reset password, email verification
- All job CRUD and state transitions
- Photo upload (presigned S3 URL)
- Quote submission + revision workflow
- Schedule management
- Site report CRUD + draft auto-save
- PDF generation (Puppeteer, triggered by BullMQ)
- Push notification dispatch (FCM)
- Email dispatch (SendGrid)
- Template-driven notifications
- Audit logging on all mutations
- Rate limiting
- Admin-only endpoints protected by role guard
- Object-level authorization on all read endpoints

**Infrastructure**
- PostgreSQL on RDS (or Supabase)
- S3 for file storage
- Redis (Upstash or ElastiCache) for BullMQ + rate limiting
- ECS Fargate containers
- CloudFront CDN
- Sentry for error tracking
- GitHub Actions CI/CD

### NOT in MVP

- SMS notifications
- In-app chat/messaging
- AI photo quality scoring
- OCR for address extraction from photos
- Voice notes
- Multi-company tenancy
- Subcontractor hierarchy
- Digital signatures (signatures in site reports are captured as touch drawings but not legally binding at MVP)
- Calendar sync (Google/Apple Cal deep links only — ICS export in Phase 2)
- Offline-first mode
- Route planning
- Contractor performance dashboards
- MFA (architecture ready, UI not in MVP)

---

## 12. PHASE 2 ENHANCEMENTS

| Feature | Priority | Effort | Notes |
|---------|----------|--------|-------|
| SMS notifications (Twilio) | High | Medium | SMS templates, phone verification |
| In-app chat | High | High | WebSocket (Socket.io or Ably) |
| MFA (TOTP) | High | Low | `otplib` already architected |
| Digital signatures | Medium | Medium | HelloSign API or DocuSign integration |
| Calendar sync (Google Cal) | Medium | Medium | Google Calendar API + CalDAV |
| AI photo quality check | Medium | High | AWS Rekognition or custom model |
| OCR address extraction | Low | Medium | Google Vision API |
| Voice notes in site report | Low | Medium | expo-av |
| Offline-first | Low | Very High | WatermelonDB or similar |
| Multi-company tenancy | Low | Very High | Add `companyId` scoping |
| Route planning | Low | High | Mapbox Optimization API |
| Contractor performance dashboards | Low | Medium | Additional analytics views |
| Subcontractor hierarchy | Low | High | Assignment chains |

---

## 13. FOLDER STRUCTURE

### Backend Repository (`solar-ops-api`)

```
solar-ops-api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/
│   │   ├── decorators/          (@CurrentUser, @Roles, @Public)
│   │   ├── guards/              (JwtAuthGuard, RolesGuard, ThrottlerGuard)
│   │   ├── interceptors/        (LoggingInterceptor, AuditInterceptor)
│   │   ├── filters/             (HttpExceptionFilter)
│   │   ├── pipes/               (ValidationPipe)
│   │   └── utils/               (prisma helper, hash utils)
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/          (JwtStrategy)
│   │   ├── guards/
│   │   └── dto/
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── dto/
│   ├── jobs/
│   │   ├── jobs.module.ts
│   │   ├── jobs.controller.ts
│   │   ├── jobs.service.ts
│   │   ├── jobs.state-machine.ts  (state transition logic)
│   │   └── dto/
│   ├── photos/
│   │   ├── photos.module.ts
│   │   ├── photos.controller.ts
│   │   ├── photos.service.ts
│   │   └── dto/
│   ├── quotes/
│   ├── schedules/
│   ├── reports/
│   ├── notifications/
│   ├── admin/
│   ├── scaffolders/
│   └── prisma/
│       ├── prisma.module.ts
│       ├── prisma.service.ts
│       └── migrations/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── test/
│   ├── auth.e2e-spec.ts
│   ├── jobs.e2e-spec.ts
│   └── ...
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── tsconfig.json
├── nest-cli.json
└── package.json
```

### Mobile App Repository (`solar-ops-mobile`)

```
solar-ops-mobile/
├── app/                        (Expo Router file-based routing)
│   ├── _layout.tsx             (root layout with providers)
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (owner)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── jobs/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx
│   │   │   └── [id]/
│   │   │       ├── index.tsx
│   │   │       ├── submit.tsx
│   │   │       └── schedule.tsx
│   │   ├── notifications.tsx
│   │   └── profile.tsx
│   ├── (scaffolder)/
│   ├── (engineer)/
│   └── +html.tsx              (PDF viewer)
├── src/
│   ├── components/
│   │   ├── ui/                (shadcn-style primitives)
│   │   ├── job/               (JobCard, StatusBadge, Timeline)
│   │   ├── photo/             (PhotoCapture, PhotoGrid, PhotoReview)
│   │   └── forms/             (QuoteForm, ReportForm, ScheduleForm)
│   ├── hooks/                 (useAuth, useJob, usePhotos, useNotifications)
│   ├── stores/                (Zustand: authStore, jobStore, notificationStore)
│   ├── lib/
│   │   ├── api.ts            (axios instance)
│   │   ├── auth.ts           (token management)
│   │   ├── s3.ts             (presigned URL logic)
│   │   └── notifications.ts  (expo-notifications helpers)
│   ├── types/                 (generated from backend OpenAPI schema)
│   └── utils/
├── assets/
│   ├── icons/
│   ├── images/
│   └── fonts/
├── eas.json
├── app.json
├── babel.config.js
├── tsconfig.json
└── package.json
```

### Admin Portal Repository (`solar-ops-admin`)

```
solar-ops-admin/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── jobs/
│   ├── scaffolders/
│   ├── engineers/
│   ├── owners/
│   ├── regions/
│   ├── notifications/
│   ├── audit-log/
│   ├── analytics/
│   ├── settings/
│   └── users/
├── src/
│   ├── components/
│   │   ├── ui/                (shadcn/ui components)
│   │   ├── jobs/              (JobTable, JobKanban, JobDetail)
│   │   ├── photos/            (PhotoReviewGrid)
│   │   └── charts/            (MetricsChart)
│   ├── hooks/
│   ├── lib/
│   │   └── api.ts
│   └── types/
├── public/
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 14. DATABASE SCHEMA DRAFT (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ADMIN
  OWNER
  SCAFFOLDER
  ENGINEER
}

enum JobStatus {
  DRAFT
  AWAITING_OWNER_SUBMISSION
  SUBMITTED
  NEEDS_MORE_INFO
  VALIDATED
  ASSIGNED_TO_SCAFFOLDER
  QUOTE_PENDING
  QUOTE_SUBMITTED
  QUOTE_REVISION_REQUESTED
  QUOTE_APPROVED
  QUOTE_REJECTED
  SCHEDULING_IN_PROGRESS
  SCHEDULED
  SCAFFOLD_WORK_IN_PROGRESS
  SCAFFOLD_COMPLETE
  INSTALLER_ASSIGNED
  SITE_REPORT_PENDING
  SITE_REPORT_IN_PROGRESS
  SITE_REPORT_SUBMITTED
  COMPLETED
  CANCELLED
  ON_HOLD
}

enum PhotoStatus {
  PENDING
  APPROVED
  REJECTED
}

enum QuoteStatus {
  PENDING
  APPROVED
  REJECTED
  REVISION_REQUESTED
}

enum ScheduleStatus {
  PROPOSED
  CONFIRMED
  CHANGE_REQUESTED
  CANCELLED
}

enum ScheduleResponseType {
  CONFIRMED
  CHANGE_REQUESTED
  UNAVAILABLE
}

enum SiteReportStatus {
  DRAFT
  IN_PROGRESS
  SUBMITTED
}

enum NotificationChannel {
  PUSH
  EMAIL
  SMS
}

enum NotificationEvent {
  INVITATION_SENT
  PHOTOS_REQUESTED
  PHOTOS_APPROVED
  MORE_INFO_REQUESTED
  SCAFFOLDER_ASSIGNED
  QUOTE_SUBMITTED
  QUOTE_REVISED
  QUOTE_APPROVED
  QUOTE_REJECTED
  SCHEDULING_REQUESTED
  DATE_CONFIRMED
  DATE_CHANGED
  WORK_STARTED
  WORK_COMPLETED
  SITE_REPORT_SUBMITTED
  PDF_READY
}

model User {
  id              String    @id @default(uuid())
  email           String    @unique
  passwordHash    String?
  firstName       String
  lastName        String
  role            UserRole
  emailVerified   DateTime?
  mfaEnabled      Boolean   @default(false)
  mfaSecret       String?
  companyId       String?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?

  // Relations
  properties      Property[]
  jobsCreated     Job[]      @relation("JobCreator")
  photos          Photo[]
  quotes          Quote[]
  siteReports     SiteReport[]
  comments        Comment[]
  notifications   Notification[]
  auditLogs       AuditLog[]
  sessions        Session[]
  refreshTokens   RefreshToken[]

  // Scaffolder profile (if role = SCAFFOLDER)
  scaffolderProfile Scaffolder?

  // Engineer profile (if role = ENGINEER)
  engineerProfile   Engineer?

  // Owner profile (if role = OWNER)
  ownerProfile      OwnerProfile?

  // Admin profile (if role = ADMIN)
  adminProfile      AdminProfile?

  consentRecords   ConsentRecord[]
  deletionRequests AccountDeletionRequest[]

  @@index([email])
  @@index([role])
  @@index([deletedAt])
}

model OwnerProfile {
  id        String  @id @default(uuid())
  userId    String  @unique
  user      User    @relation(fields: [userId], references: [id])
  phone     String?

  properties Property[]

  @@map("owner_profile")
}

model AdminProfile {
  id     String @id @default(uuid())
  userId String @unique
  user   User   @relation(fields: [userId], references: [id])

  @@map("admin_profile")
}

model Scaffolder {
  id          String    @id @default(uuid())
  userId      String    @unique
  user        User      @relation(fields: [userId], references: [id])
  companyName String?
  phone       String?
  isActive    Boolean   @default(true)

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  assignments Assignment[]
  quotes      Quote[]
  regions     ScaffolderRegion[]

  @@index([isActive])
  @@map("scaffolder")
}

model Engineer {
  id          String    @id @default(uuid())
  userId      String    @unique
  user        User      @relation(fields: [userId], references: [id])
  companyName String?
  phone       String?
  isActive    Boolean   @default(true)

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  siteReports SiteReport[]
  assignments Assignment[]   @relation("EngineerAssignment")

  @@index([isActive])
  @@map("engineer")
}

model Region {
  id          String    @id @default(uuid())
  name        String    @unique  // e.g. "North Ireland", "South West"
  description String?
  isActive    Boolean   @default(true)

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  scaffolderRegions ScaffolderRegion[]
  properties Property[]

  @@map("region")
}

model ScaffolderRegion {
  scaffolderId String
  regionId     String
  scaffolder   Scaffolder @relation(fields: [scaffolderId], references: [id])
  region       Region     @relation(fields: [regionId], references: [id])

  @@id([scaffolderId, regionId])
  @@map("scaffolder_region")
}

model Property {
  id          String    @id @default(uuid())
  ownerId     String?
  ownerUserId String?
  regionId    String?
  address     String
  addressLine2 String?
  city        String?
  postcode    String    // UK postcode
  lat         Float?
  lng         Float?
  propertyType String?

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  owner       OwnerProfile? @relation(fields: [ownerId], references: [id])
  region      Region?       @relation(fields: [regionId], references: [id])
  jobs        Job[]

  @@index([postcode])
  @@index([regionId])
  @@map("property")
}

model Job {
  id            String     @id @default(uuid())
  propertyId    String
  createdById   String
  status        JobStatus  @default(DRAFT)
  jobReference  String     @unique  // e.g. "SOLAR-2026-0001"
  notes         String?    // admin internal notes
  priority      Int        @default(0)  // 0=normal, 1=urgent
  completionPhotosRequired Boolean @default(false)  // admin config

  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  property      Property   @relation(fields: [propertyId], references: [id])
  creator       User       @relation("JobCreator", fields: [createdById], references: [id])

  invitations   JobInvitation[]
  statusHistory JobStatusHistory[]
  photos        Photo[]
  assignments   Assignment[]
  quotes        Quote[]
  schedules     Schedule[]
  siteReports   SiteReport[]
  comments      Comment[]
  notifications Notification[]
  generatedPdfs GeneratedPDF[]
  auditLogs     AuditLog[]

  @@index([status])
  @@index([propertyId])
  @@index([createdAt])
  @@index([jobReference])
  @@map("job")
}

model JobStatusHistory {
  id          String     @id @default(uuid())
  jobId       String
  fromStatus  JobStatus?
  toStatus    JobStatus
  changedById String
  notes       String?
  createdAt   DateTime   @default(now())

  job         Job        @relation(fields: [jobId], references: [id])
  changedBy   User       @relation(fields: [changedById], references: [id])

  @@index([jobId])
  @@map("job_status_history")
}

model JobInvitation {
  id         String    @id @default(uuid())
  jobId      String
  email      String
  token      String    @unique
  expiresAt  DateTime
  acceptedAt DateTime?
  createdAt  DateTime  @default(now())

  job        Job       @relation(fields: [jobId], references: [id])

  @@index([token])
  @@index([email])
  @@map("job_invitation")
}

model Photo {
  id          String       @id @default(uuid())
  jobId       String
  uploadedById String
  url         String       // S3 key
  type        String       // EXTERIOR, ROOF, ACCESS, HEIGHT, OBSTACLE, COMPLETION, REPORT
  status      PhotoStatus  @default(PENDING)
  rejectionReason String?
  metadata    Json?        // EXIF data (stripped of sensitive info)
  caption     String?
  createdAt   DateTime     @default(now())

  job         Job         @relation(fields: [jobId], references: [id])
  uploadedBy  User        @relation(fields: [uploadedById], references: [id])
  siteReportPhotos SiteReportPhoto[]

  @@index([jobId])
  @@index([status])
  @@map("photo")
}

model Assignment {
  id           String    @id @default(uuid())
  jobId        String
  scaffolderId String?
  engineerId   String?
  assignedById String
  assignedAt   DateTime  @default(now())

  job          Job       @relation(fields: [jobId], references: [id])
  scaffolder   Scaffolder? @relation(fields: [scaffolderId], references: [id])
  engineer     Engineer?   @relation("EngineerAssignment", fields: [engineerId], references: [id])
  assignedBy   User       @relation(fields: [assignedById], references: [id])

  @@unique([jobId, scaffolderId])
  @@unique([jobId, engineerId])
  @@index([scaffolderId])
  @@index([engineerId])
  @@map("assignment")
}

model Quote {
  id           String      @id @default(uuid())
  jobId        String
  scaffolderId String
  amount       Decimal     @db.Decimal(10, 2)
  currency     String      @default("GBP")
  proposedDate DateTime?
  proposedEndDate DateTime?
  notes        String?     // assumptions, exclusions
  status       QuoteStatus @default(PENDING)
  validUntil   DateTime?
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  job          Job        @relation(fields: [jobId], references: [id])
  scaffolder   User       @relation(fields: [scaffolderId], references: [id])
  revisions    QuoteRevision[]

  @@index([jobId])
  @@index([status])
  @@map("quote")
}

model QuoteRevision {
  id        String   @id @default(uuid())
  quoteId   String
  amount    Decimal  @db.Decimal(10, 2)
  notes     String?
  createdAt DateTime @default(now())

  quote     Quote    @relation(fields: [quoteId], references: [id])

  @@index([quoteId])
  @@map("quote_revision")
}

model Schedule {
  id               String         @id @default(uuid())
  jobId            String
  proposedDate     DateTime
  proposedEndDate  DateTime?
  status           ScheduleStatus @default(PROPOSED)
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  job              Job              @relation(fields: [jobId], references: [id])
  responses        ScheduleResponse[]

  @@index([jobId])
  @@map("schedule")
}

model ScheduleResponse {
  id         String                @id @default(uuid())
  scheduleId String
  userId     String
  response   ScheduleResponseType
  notes      String?
  createdAt  DateTime              @default(now())

  schedule   Schedule              @relation(fields: [scheduleId], references: [id])
  user       User                  @relation(fields: [userId], references: [id])

  @@index([scheduleId])
  @@unique([scheduleId, userId])
  @@map("schedule_response")
}

model SiteReport {
  id           String          @id @default(uuid())
  jobId        String
  engineerId   String
  status       SiteReportStatus @default(DRAFT)
  answers      Json            // Dynamic form answers
  draft        Boolean         @default(true)
  signatureUrl String?         // S3 key for signature image
  submittedAt  DateTime?
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  job          Job             @relation(fields: [jobId], references: [id])
  engineer     User             @relation(fields: [engineerId], references: [id])
  photos       SiteReportPhoto[]

  @@index([jobId])
  @@index([engineerId])
  @@map("site_report")
}

model SiteReportPhoto {
  id          String     @id @default(uuid())
  siteReportId String
  photoId     String

  siteReport  SiteReport @relation(fields: [siteReportId], references: [id])
  photo       Photo      @relation(fields: [photoId], references: [id])

  @@unique([siteReportId, photoId])
  @@map("site_report_photo")
}

model GeneratedPDF {
  id        String   @id @default(uuid())
  jobId     String
  type      String   // SITE_REPORT, QUOTE_SUMMARY
  url       String   // S3 key
  createdAt DateTime @default(now())

  job       Job      @relation(fields: [jobId], references: [id])

  @@index([jobId])
  @@map("generated_pdf")
}

model Comment {
  id        String   @id @default(uuid())
  jobId     String
  userId    String
  parentId  String?  // for threading
  body      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  job       Job      @relation(fields: [jobId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
  parent    Comment? @relation("CommentThread", fields: [parentId], references: [id])
  replies   Comment[] @relation("CommentThread")

  @@index([jobId])
  @@map("comment")
}

model Notification {
  id          String             @id @default(uuid())
  userId      String
  jobId       String?
  templateId  String?
  channel     NotificationChannel
  title       String
  body        String
  data        Json?              // { jobId, action, etc. }
  read        Boolean            @default(false)
  sentAt      DateTime?
  createdAt   DateTime           @default(now())

  user        User               @relation(fields: [userId], references: [id])
  job         Job?               @relation(fields: [jobId], references: [id])
  template    NotificationTemplate? @relation(fields: [templateId], references: [id])

  @@index([userId, read])
  @@index([jobId])
  @@map("notification")
}

model NotificationTemplate {
  id         String              @id @default(uuid())
  event      NotificationEvent   @unique
  channel    NotificationChannel
  subject    String?             // for email
  body       String              // template with {{variable}} syntax
  variables  String[]            // expected variables
  isActive   Boolean             @default(true)
  createdAt  DateTime            @default(now())
  updatedAt  DateTime            @updatedAt

  notifications Notification[]

  @@map("notification_template")
}

model AuditLog {
  id         String   @id @default(uuid())
  userId     String?
  action     String   // CREATE, UPDATE, DELETE
  entityType String   // Job, Photo, User, etc.
  entityId   String
  metadata   Json?    // { field, from, to, ... }
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())

  user       User?    @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("audit_log")
}

model Session {
  id              String   @id @default(uuid())
  userId          String
  refreshTokenId  String
  ipAddress       String?
  userAgent       String?
  expiresAt       DateTime
  createdAt       DateTime @default(now())

  user            User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@map("session")
}

model RefreshToken {
  id        String    @id @default(uuid())
  userId    String
  tokenHash String    @unique
  deviceInfo String?
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime  @default(now())

  user      User      @relation(fields: [userId], references: [id])
  sessions  Session[]

  @@index([userId])
  @@index([tokenHash])
  @@map("refresh_token")
}

model ConsentRecord {
  id           String   @id @default(uuid())
  userId       String
  consentType  String   // PRIVACY_POLICY, TERMS, MARKETING
  granted      Boolean
  ipAddress    String?
  createdAt    DateTime @default(now())

  user         User     @relation(fields: [userId], references: [id])

  @@unique([userId, consentType])
  @@index([userId])
  @@map("consent_record")
}

model AccountDeletionRequest {
  id          String    @id @default(uuid())
  userId      String
  requestedAt DateTime  @default(now())
  processedAt DateTime?
  status      String    @default("PENDING") // PENDING, PROCESSED, REJECTED
  processedBy String?

  user        User      @relation(fields: [userId], references: [id])

  @@index([userId])
  @@map("account_deletion_request")
}
```

---

## 15. SCREEN-BY-SCREEN BREAKDOWN

### Mobile Screens (React Native + Expo Router)

| Screen | Route | Components | State | Validation | Offline |
|--------|-------|-----------|-------|------------|---------|
| Login | `/login` | EmailInput, PasswordInput, MagicLinkButton, ForgotPasswordLink | formState | Zod email + password | No |
| Register | `/register` | NameInput, EmailInput, PasswordInput, ConfirmPasswordInput, TermsCheckbox | formState | Zod + password match | No |
| Forgot Password | `/forgot-password` | EmailInput, SubmitButton | formState | Zod email | No |
| Owner Job List | `/owner/jobs` | JobCard[], EmptyState, PullToRefresh | jobs[], loading | — | Optimistic |
| Owner Job Detail | `/owner/jobs/:id` | StatusTimeline, PropertyCard, PhotoGrid, ActionCard | job, loading | — | Cache |
| Owner Submit Step 1 | `/owner/jobs/:id/submit` | CameraView, PhotoPreview[], RequiredBadge, ProgressBar | photos[], step | Min photos required | Queue upload |
| Owner Submit Step 2-5 | `/owner/jobs/:id/submit` | (same pattern, different prompts) | photos[], step | Per-step validation | Queue upload |
| Owner Submit Review | `/owner/jobs/:id/submit/review` | PhotoGrid, LocationMap, SubmitButton | photos[], location | All required met | No |
| Owner Schedule | `/owner/jobs/:id/schedule` | DateCard, ConfirmButton, RescheduleButton, UnavailableButton | schedule, loading | — | Cache |
| Scaffolder Job List | `/scaffolder/jobs` | JobCard[], FilterChips (Pending, Scheduled, Complete) | jobs[], filter, loading | — | Optimistic |
| Scaffolder Job Detail | `/scaffolder/jobs/:id` | PhotoGrid, PropertyMap, QuoteCard, ActionButton | job, loading | — | Cache |
| Scaffolder Quote | `/scaffolder/jobs/:id/quote` | AmountInput, DatePicker, NotesInput, AssumptionsInput, ExclusionsInput | quoteForm, saving | Zod amount > 0 | Auto-save draft |
| Scaffolder Mark Complete | `/scaffolder/jobs/:id/complete` | CompletionPhotoCapture, MarkCompleteButton | photos[], confirming | Admin config check | No |
| Engineer Job List | `/engineer/jobs` | JobCard[], FilterChips | jobs[], filter, loading | — | Optimistic |
| Engineer Report | `/engineer/jobs/:id/report` | SectionCard[], DynamicInput, PhotoCapture, SignatureCapture | report, draft, saving | Required fields + photos | Auto-save |
| Notifications | `/(role)/notifications` | NotificationItem[], MarkAllRead | notifications[], loading | — | Cache |

### Admin Portal Screens (Next.js)

| Screen | Components | Data |
|--------|-----------|------|
| Dashboard | KPICard[], PipelineKanban, ActivityFeed, MapWidget | Aggregated metrics |
| Job List | DataTable (TanStack), FilterBar, KanbanToggle | Paginated jobs |
| Job Detail | PhotoGrid, StatusTimeline, QuoteCard, ScheduleCard, CommentThread, AssignScaffolder | Full job + relations |
| Photo Review | PhotoGrid, ZoomModal, ApproveAllButton, RejectModal | Photos by status |
| Quote Review | QuoteCard, ApproveButton, RevisionButton, RejectButton | Quote + history |
| Schedule Manager | CalendarView, ProposeDateModal, ResponseList | Schedules + responses |
| Site Report Viewer | PDFViewer, AnswerList, PhotoGallery | Report + generated PDF |
| Scaffolder Management | DataTable, RegionTagInput, ActivateDeactivate | Scaffolders |
| Region Management | CRUDTable | Regions |
| User Management | DataTable, InviteUserModal, RoleSelect | Users |
| Notification Templates | TemplateEditor (WYSIWYG) | Templates |
| Audit Log | SearchableTable, DateRangePicker | AuditLog[] |
| Analytics | LineChart (time metrics), BarChart (by region), KPI cards | Aggregated |

---

## 16. STATE MACHINE FOR JOB LIFECYCLE

### States and Transitions

```
DRAFT
  └── SEND_INVITATION ──► AWAITING_OWNER_SUBMISSION

AWAITING_OWNER_SUBMISSION
  ├── OWNER_SUBMITS ──────────────► SUBMITTED
  ├── ADMIN_CANCELS ───────────────► CANCELLED
  └── OWNER_EXPIRES (auto, 14d) ───► CANCELLED

SUBMITTED
  ├── ADMIN_REJECTS ────────────────► CANCELLED
  ├── ADMIN_REQUESTS_MORE_INFO ────► NEEDS_MORE_INFO
  └── ADMIN_VALIDATES ─────────────► VALIDATED

NEEDS_MORE_INFO
  ├── OWNER_RESUBMITS ─────────────► SUBMITTED
  └── ADMIN_REJECTS ───────────────► CANCELLED

VALIDATED
  └── ADMIN_ASSIGNS_SCAFFOLDER ────► ASSIGNED_TO_SCAFFOLDER

ASSIGNED_TO_SCAFFOLDER
  └── SCAFFOLDER_SUBMITS_QUOTE ────► QUOTE_PENDING

QUOTE_PENDING
  ├── ADMIN_REJECTS_QUOTE ─────────► QUOTE_REJECTED
  ├── ADMIN_REQUESTS_REVISION ─────► QUOTE_REVISION_REQUESTED
  └── ADMIN_APPROVES_QUOTE ─────────► QUOTE_APPROVED

QUOTE_REVISION_REQUESTED
  └── SCAFFOLDER_SUBMITS_REVISION ─► QUOTE_PENDING

QUOTE_REJECTED
  └── (job ends; admin can reassign scaffolder)

QUOTE_APPROVED
  └── ADMIN_STARTS_SCHEDULING ─────► SCHEDULING_IN_PROGRESS

SCHEDULING_IN_PROGRESS
  ├── ALL_CONFIRM ─────────────────► SCHEDULED
  ├── ANY_UNAVAILABLE ─────────────► SCHEDULING_IN_PROGRESS (reschedule)
  └── ADMIN_CANCELS ────────────────► CANCELLED

SCHEDULED
  ├── SCAFFOLDER_STARTS_WORK ──────► SCAFFOLD_WORK_IN_PROGRESS
  └── ADMIN_PUT_ON_HOLD ───────────► ON_HOLD

SCAFFOLD_WORK_IN_PROGRESS
  └── SCAFFOLDER_COMPLETES_WORK ───► SCAFFOLD_COMPLETE

SCAFFOLD_COMPLETE
  └── ADMIN_ASSIGNS_ENGINEER ─────► INSTALLER_ASSIGNED

INSTALLER_ASSIGNED
  └── ENGINEER_STARTS_REPORT ─────► SITE_REPORT_IN_PROGRESS

SITE_REPORT_IN_PROGRESS
  └── ENGINEER_SUBMITS_REPORT ────► SITE_REPORT_SUBMITTED

SITE_REPORT_SUBMITTED
  └── ADMIN_REVIEWS_REPORT ────────► COMPLETED

ON_HOLD
  └── ADMIN_RESUMES ────────────────► (previous state, stored in metadata)
```

### Guards and Validators

| Transition | Guard | Notification Triggered |
|-----------|-------|----------------------|
| `SEND_INVITATION` | Admin role | `INVITATION_SENT` |
| `OWNER_SUBMITS` | All required photos present | `PHOTOS_SUBMITTED` (to admin) |
| `ADMIN_VALIDATES` | Admin role + min 1 approved photo | `PHOTOS_APPROVED` |
| `ADMIN_REQUESTS_MORE_INFO` | Admin role + rejection reason required | `MORE_INFO_REQUESTED` |
| `ADMIN_ASSIGNS_SCAFFOLDER` | Admin role + scaffolder required | `SCAFFOLDER_ASSIGNED` |
| `SCAFFOLDER_SUBMITS_QUOTE` | Scaffolder assigned to job + amount > 0 | `QUOTE_SUBMITTED` |
| `ADMIN_APPROVES_QUOTE` | Admin role + quote exists | `QUOTE_APPROVED` |
| `ADMIN_REJECTS_QUOTE` | Admin role | `QUOTE_REJECTED` |
| `ADMIN_REQUESTS_REVISION` | Admin role + revision notes | `QUOTE_REVISION_REQUESTED` |
| `ALL_CONFIRM` (schedule) | Owner + scaffolder confirmed | `DATE_CONFIRMED` |
| `SCAFFOLDER_COMPLETES_WORK` | Scaffolder assigned to job | `WORK_COMPLETED` |
| `ENGINEER_SUBMITS_REPORT` | Engineer assigned + all required fields | `SITE_REPORT_SUBMITTED` + `PDF_READY` |
| `ADMIN_REVIEWS_REPORT` | Admin role | (closes job) |

---

## 17. NOTIFICATION EVENT MATRIX

| Event | Template ID | Channel | Recipient | Variables |
|-------|-----------|---------|-----------|-----------|
| `INVITATION_SENT` | invite | EMAIL + PUSH | Owner (email) | jobReference, address, loginUrl |
| `PHOTOS_REQUESTED` | photos_requested | PUSH | Owner | jobReference, whatIsNeeded |
| `PHOTOS_APPROVED` | photos_approved | PUSH | Owner | jobReference |
| `MORE_INFO_REQUESTED` | more_info | EMAIL + PUSH | Owner | jobReference, whatIsNeeded, resubmitUrl |
| `SCAFFOLDER_ASSIGNED` | scaffolder_assigned | PUSH | Scaffolder | jobReference, address |
| `QUOTE_SUBMITTED` | quote_submitted | EMAIL + PUSH | Admin | jobReference, scaffolderName, amount |
| `QUOTE_REVISED` | quote_revised | EMAIL + PUSH | Admin | jobReference, amount |
| `QUOTE_APPROVED` | quote_approved | EMAIL + PUSH | Scaffolder, Owner | jobReference, amount |
| `QUOTE_REJECTED` | quote_rejected | EMAIL + PUSH | Scaffolder | jobReference, reason |
| `QUOTE_REVISION_REQUESTED` | quote_revision | EMAIL + PUSH | Scaffolder | jobReference, revisionNotes |
| `SCHEDULING_REQUESTED` | scheduling_requested | EMAIL + PUSH | Owner | jobReference, proposedDate, respondUrl |
| `DATE_CONFIRMED` | date_confirmed | EMAIL + PUSH | Admin, Scaffolder, Owner | jobReference, confirmedDate |
| `DATE_CHANGED` | date_changed | EMAIL + PUSH | Admin, Scaffolder, Owner | jobReference, newDate |
| `WORK_STARTED` | work_started | EMAIL + PUSH | Admin | jobReference, scaffolderName |
| `WORK_COMPLETED` | work_completed | EMAIL + PUSH | Admin, Owner | jobReference |
| `SITE_REPORT_SUBMITTED` | report_submitted | EMAIL + PUSH | Admin | jobReference |
| `PDF_READY` | pdf_ready | EMAIL + PUSH | Admin, Owner (if enabled) | jobReference, downloadUrl |

---

## 18. SITE REPORT GENERATION APPROACH

### Dynamic Form Schema

The site report form is driven by a JSON schema stored in the database (`SiteReportTemplate` entity, not in MVP schema but designed for Phase 2):

```json
{
  "sections": [
    {
      "id": "installation",
      "title": "Installation Details",
      "fields": [
        { "id": "panel_count", "type": "number", "label": "Number of panels", "required": true },
        { "id": "panel_model", "type": "dropdown", "label": "Panel model", "options": [...], "required": true },
        { "id": "inverter_type", "type": "dropdown", "label": "Inverter type", "options": [...], "required": true },
        { "id": "installation_notes", "type": "textarea", "label": "Installation notes", "required": false }
      ]
    },
    {
      "id": "condition",
      "title": "Panel Condition",
      "fields": [
        { "id": "roof_condition", "type": "dropdown", "label": "Roof condition", "options": ["Good", "Fair", "Poor"], "required": true },
        { "id": "panel_front_photo", "type": "photo", "label": "Panel array photo", "required": true },
        { "id": "obstructions", "type": "yesno", "label": "Any obstructions?", "required": true }
      ]
    },
    {
      "id": "electrical",
      "title": "Electrical Checks",
      "fields": [
        { "id": "inverter_status", "type": "yesno", "label": "Inverter operational?", "required": true },
        { "id": "meter_reading", "type": "number", "label": "Meter reading (kWh)", "required": true }
      ]
    },
    {
      "id": "signoff",
      "title": "Sign Off",
      "fields": [
        { "id": "engineer_signature", "type": "signature", "label": "Engineer signature", "required": true },
        { "id": "site_photos", "type": "photo", "label": "Completion site photos", "required": true, "count": 4 }
      ]
    }
  ]
}
```

### PDF Generation Pipeline

```
1. Engineer submits report (or auto-save triggers)
2. BullMQ job: GENERATE_SITE_REPORT_PDF queued
3. Worker:
   a. Fetches SiteReport + Job + Property + Engineer from DB
   b. Renders HTML template using React (react-pdf or handlebars)
   c. Template includes: header (logo), job ref, address, engineer name, date, all answers, photos (embedded as base64 or linked), signature
   d. Puppeteer (headless Chrome) converts HTML → PDF
   e. PDF uploaded to S3 (private bucket, presigned URL for download)
   f. GeneratedPDF record created
   g. Notification: PDF_READY sent to admin
4. Admin portal: iframe PDF viewer using presigned URL (1-hour expiry)
```

### PDF Template (HTML)

```
┌─────────────────────────────────────┐
│ [SolarOps Logo]     SITE REPORT      │
│                     Ref: SOLAR-2026-0001 │
├─────────────────────────────────────┤
│ Property: 12 High Street, Bristol    │
│ Engineer: John Smith                │
│ Date: 19 March 2026                 │
├─────────────────────────────────────┤
│ SECTION: Installation Details        │
│ Panels Installed: 8                 │
│ Panel Model: SunPower SPR-MAX        │
│ ...                                 │
├─────────────────────────────────────┤
│ [Photo Grid]                        │
│ [Photo 1] [Photo 2] [Photo 3]       │
├─────────────────────────────────────┤
│ SECTION: Electrical Checks           │
│ Inverter Status: Yes                 │
│ Meter Reading: 12450 kWh            │
├─────────────────────────────────────┤
│ [Signature Image]                    │
│ Engineer: John Smith                │
└─────────────────────────────────────┘
```

---

## 19. DEPLOYMENT ARCHITECTURE

### AWS (Production)

```
                         ┌──────────────────┐
                         │    Route 53      │
                         │  (DNS + Health)  │
                         └────────┬─────────┘
                                  │
                         ┌────────▼─────────┐
                         │   CloudFront     │
                         │  (Global CDN)    │
                         └────────┬─────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
    ┌─────────▼─────────┐ ┌──────▼──────┐  ┌────────▼────────┐
    │   Admin Portal    │ │ Mobile API   │  │  Static Assets  │
    │   (Next.js SSR)   │ │  (NestJS)    │  │  (S3 + CF)      │
    │   ECS Fargate     │ │  ECS Fargate │  │                 │
    └───────────────────┘ └──────┬──────┘  └─────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │              │
            ┌───────▼──┐  ┌──────▼──┐  ┌──────▼──────┐
            │ RDS (PG) │  │ Elasti  │  │     S3       │
            │  16      │  │ Cache   │  │  (us-east-1) │
            │ (Primary │  │ (Redis) │  │  Private     │
            │ + Read   │  │ BullMQ  │  │  Bucket      │
            │ Replica) │  │ Queue   │  └──────────────┘
            └──────────┘  └─────────┘
```

### Environment Configuration

| Variable | dev | staging | production |
|----------|-----|---------|------------|
| `DATABASE_URL` | localhost:5432 | staging RDS | prod RDS |
| `REDIS_URL` | localhost:6379 | ElastiCache staging | ElastiCache prod |
| `S3_BUCKET` | solar-ops-dev | solar-ops-staging | solar-ops-prod |
| `ENVIRONMENT` | development | staging | production |
| `CORS_ORIGINS` | localhost:* | staging domain | prod domain |
| `JWT_SECRET` | dev-secret | staging-secret | Secrets Manager |
| `SENDGRID_API_KEY` | test key | staging key | prod key |
| `FCM_PROJECT_ID` | dev project | staging project | prod project |

### Environment Separation

- **dev**: Local Docker Compose; used by individual developers
- **staging**: AWS (mirrors prod); auto-deploys from `main` branch after CI passes; used for QA and UAT
- **production**: AWS; manual deploy after staging sign-off; blue/green deployment via ECS

---

## 20. CI/CD AND ENVIRONMENTS PLAN

### GitHub Actions Workflows

#### 1. `ci.yml` — Run on Every PR
```yaml
on: [pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps: [ESLint, Prettier check, TypeScript check]
  test:
    runs-on: ubuntu-latest
    services: [postgres, redis]
    steps: [jest unit tests, integration tests]
  build-mobile:
    runs-on: ubuntu-latest
    steps: [expo tamagotchi-check, eas build --local --profile preview]
```

#### 2. `deploy-api.yml` — On Merge to main → staging
```yaml
on:
  push:
    branches: [main]
    paths: ['solar-ops-api/**']
jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    steps:
      - Checkout
      - Configure AWS credentials
      - Run database migrations (Prisma migrate deploy)
      - Build Docker image
      - Push to ECR
      - Update ECS task definition
      - Restart ECS service
```

#### 3. `deploy-admin.yml` — On Merge to main → staging
```yaml
on:
  push:
    branches: [main]
    paths: ['solar-ops-admin/**']
jobs:
  deploy-staging:
    steps:
      - Checkout
      - Setup Node 20
      - NEXTAUTH_SECRET (from Secrets Manager)
      - run: next build
      - run: aws s3 sync out/ s3://solar-ops-admin-staging
      - Invalidate CloudFront cache
```

#### 4. `deploy-prod.yml` — Manual Trigger (workflow_dispatch)
```yaml
on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version tag'
        required: true
jobs:
  deploy-api-prod:
    ...
  deploy-admin-prod:
    ...
```

#### 5. `eas-build.yml` — Expo EAS for Mobile Apps
```yaml
on:
  push:
    branches: [main, 'release/**']
jobs:
  build-ios:
    runs-on: macos-latest
    steps:
      - expo login
      - eas build --platform ios --profile production --auto-submit
  build-android:
    runs-on: ubuntu-latest
    steps:
      - expo login
      - eas build --platform android --profile production --auto-submit
```

### Secrets Management in CI

```yaml
# GitHub Actions secrets stored per repo:
# AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY (for ECR + ECS deploy)
# EAS_TOKEN (for Expo EAS)
# SENTRY_AUTH_TOKEN (for source maps)
# SENDGRID_API_KEY (staging + prod)
# DATABASE_URL (for migrations job)
```

---

## 21. QA STRATEGY

### Testing Pyramid

```
        ▲
       /E2E\          Playwright: critical user flows
      /------\        (login, submit photos, quote, report)
     /Integration\    Supertest: API endpoints
    /--------------\
   /  Unit Tests     Jest: services, utils, state machines
  /------------------\
```

### Unit Tests

- **Services**: Prisma service methods (mock Prisma client)
- **State Machine**: All transition guards, invalid transition rejection
- **Validation**: Zod schemas (valid/invalid inputs)
- **Utils**: JWT signing/verification, password hashing, template variable substitution
- **Target**: >80% coverage on backend services

### Integration Tests

- API routes with real DB (Testcontainers or separate test DB)
- Auth flows (login, refresh, logout, password reset)
- Job CRUD + state transitions end-to-end
- Photo upload pipeline (mock S3 with localstack)

### E2E Tests (Playwright)

| Test | Description |
|------|------------|
| `owner-auth.spec` | Register, login, magic link, logout |
| `owner-submission.spec` | Submit photos, location, re-submit after request |
| `scaffolder-quote.spec` | Login, view job, submit quote, revision flow |
| `admin-validation.spec` | Review photos, approve, assign, schedule |
| `engineer-report.spec` | Fill site report, submit, verify PDF |
| `notification.spec` | Verify push + email triggered on state change |

### Performance Testing

- k6 or Artillery: 100 concurrent users hitting API
- Target: p95 < 500ms for API responses, < 2s for page loads
- Load test on staging before each production release

### Mobile Testing

- **Expo EAS Build**: builds on every PR for iOS + Android
- **Detox** (E2E for RN): critical flows on both platforms
- **Manual QA**: TestFlight (iOS) + Internal Testing (Android) — at least 2 testers per sprint

---

## 22. ACCESSIBILITY BASELINE

### WCAG 2.1 AA Compliance (Required for App Store)

#### Mobile (React Native)

| Requirement | Implementation |
|------------|----------------|
| Color contrast 4.5:1 text, 3:1 large text | Use `#059669` (green, 4.77:1 on white); avoid orange-only CTAs on white |
| Touch targets min 44x44pt | `minHeight={44}` on all buttons |
| Screen reader labels | `accessibilityLabel` on all interactive elements |
| Dynamic type | `React Native's Text allowFontScaling` |
| Reduce motion | `AccessibilityInfo.reduceMotion` → disable non-essential animations |
| Focus order | Managed via `accessibilityActions` |

#### Web (Admin Portal)

| Requirement | Implementation |
|------------|----------------|
| Keyboard navigation | All interactive elements reachable via Tab; custom components use roving tabindex |
| Skip links | Skip to main content link |
| ARIA roles | Modal: `role="dialog"`, tables: `role="grid"`, notifications: `role="alert"` |
| Error announcements | `aria-live="polite"` for form errors |
| Focus trap in modals | `focus-trap-react` |

---

## 23. PRIVACY AND LEGAL CHECKLIST

### GDPR (UK/EU) — Required Before Launch

| Item | Owner | Status | Notes |
|------|-------|--------|-------|
| Privacy Policy published | SolarOps | LEGAL REVIEW | Must be live before app submission |
| Terms of Service published | SolarOps | LEGAL REVIEW | Must be live before app submission |
| ICO Registration | SolarOps | ACTION REQUIRED | £35-50/yr; data processor registration |
| Data Processing Agreement (if using third-party processors) | SolarOps | LEGAL REVIEW | AWS, SendGrid, FCM need DPAs |
| Lawful basis documented | SolarOps | LEGAL REVIEW | Contract (owners), Legitimate interest (contractors) |
| Privacy notice at point of collection | App | IMPLEMENTED | Permissions have in-context explanations |
| Right to access implemented | API + App | IMPLEMENTED | GET /users/me returns all data |
| Right to erasure implemented | API | IMPLEMENTED | AccountDeletionRequest flow |
| Right to portability implemented | API | IMPLEMENTED | GET /users/me/export |
| Data retention policy defined | SolarOps | LEGAL REVIEW | Job data: 7 years (UK tax); Photos: 2 years; Logs: 1 year |
| International transfer mechanism | N/A | N/A | AWS eu-west-2 (London) used; no international transfers |
| DPO appointed (if >250 employees) | SolarOps | LEGAL REVIEW | Required if large-scale processing |
| Data breach response plan | SolarOps | LEGAL REVIEW | 72-hour notification obligation to ICO |

### Data Inventory (for Privacy Policy)

| Data Type | Collected | Purpose | Retention | Shared With |
|-----------|-----------|---------|-----------|-------------|
| Email | Yes | Auth + notifications | Account lifetime | SendGrid, FCM |
| Name | Yes | Identification | Account lifetime | No third parties |
| Password hash | Yes | Authentication | Account lifetime (deleted on account deletion) | No |
| Property address | Yes | Job management | 7 years (legal) | Scaffolders assigned to job |
| Photos (property) | Yes | Site assessment | 2 years | Admin, assigned contractor |
| Location (GPS) | Approximate | Property verification | 30 days | No third parties |
| Device info | Yes | Session management | 30 days inactive | No |
| IP address | Yes | Security + fraud | 90 days | No |

### Consent Management

- Consent records stored in `ConsentRecord` table
- Owners/contractors must accept Terms + Privacy Policy on first login
- All consents timestamped with IP address
- Admin can export consent records

---

## 24. RISKS, ASSUMPTIONS, AND OPEN QUESTIONS

### Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|------------|-------|-----------|
| R1 | FCM/APNs push notification delays | Medium | Low | Fall back to email; don't block critical workflows on push |
| R2 | Photo upload failure on poor mobile network | High | Medium | Implement chunked/resumable uploads (tus-js-client) |
| R3 | PDF generation timeout for large reports | Low | Medium | Increase Puppeteer timeout; compress images before embedding |
| R4 | Scaffolder without smartphone | Medium | Medium | Provide web portal fallback for quote submission |
| R5 | Job state machine edge cases (concurrent admin actions) | Low | High | Optimistic locking via `updatedAt` version field; transaction isolation |
| R6 | GDPR data subject request during active job | Low | High | Implement 30-day processing SLA for deletion requests; retain minimal data for legal obligations |
| R7 | Firebase FCM project quota exceeded | Very Low | Medium | Use SendGrid for critical notifications; FCM is enhancement only |
| R8 | AWS egress costs for photo storage | Medium | Low | Cloudflare R2 (S3-compatible, no egress fees); implement lifecycle policy to move to Glacier after 90 days |
| R9 | Magic link email landing in spam | Medium | Medium | SPF/DKIM/DMARC properly configured; use SendGrid email validation |
| R10 | IR35 misclassification of scaffolders | Medium | High | Legal review of contractor vs employee status; use umbrella company for contractors if uncertain |

### Assumptions

| # | Assumption |
|---|-----------|
| A1 | The business is based in the UK; all data stored in AWS eu-west-2 (London) |
| A2 | All property owners have smartphones with cameras and can download apps |
| A3 | Scaffolders/contractors are willing to use a mobile app for quotes and updates |
| A4 | The number of scaffolders per region is < 500; UI and DB can handle without pagination optimization |
| A5 | Jobs are created manually by admin (not self-service from a public website at MVP) |
| A6 | Email is the primary notification channel for owners; push is secondary |
| A7 | The business has a company logo and brand colors for PDF generation |
| A8 | Site reports require 4-8 photos on average; PDF can handle this without pagination issues |
| A9 | A single admin can handle up to 50 active jobs simultaneously |
| A10 | No offline mode required at MVP; all actions require connectivity |

### Open Questions

| # | Question | Priority | Decision Needed By |
|---|----------|----------|-------------------|
| Q1 | Do scaffolders need to see each other's quotes for the same job? | High | Before schema finalization |
| Q2 | Is there a maximum budget per job that requires additional approval? | Medium | Before quote approval logic |
| Q3 | Should the admin portal support multiple company accounts (multi-tenancy)? | Low | MVP scope decision |
| Q4 | Will engineers need to use the web portal or mobile only? | Medium | Before app routing design |
| Q5 | Should owner-facing notifications be bilingual (English + Welsh)? | Low | Phase 2 at earliest |
| Q6 | Is there a need for in-app messaging between owner and contractor? | Medium | Before notification system design |
| Q7 | Should completion photos be mandatory or configurable per job? | Medium | Before scaffolding completion flow |
| Q8 | What is the job reference number format? | Low | Before job creation UI |
| Q9 | Do PDF reports need to be legally binding documents with digital signatures? | High | Affects signature capture implementation |
| Q10 | Is there a preferred payment provider for future quote-to-payment flow? | Low | Phase 2 |

---

## DESIGN SYSTEM SUMMARY

### Style Direction

**"Green Energy Pro"** — A premium, trust-first aesthetic that combines the credibility of enterprise SaaS with the warmth of renewable energy. Not sterile corporate blue, not overly playful. Think: a well-designed fintech app that happens to be about solar.

- **Visual style**: Clean SaaS minimalism with purposeful use of green energy palette
- **Personality**: Professional, reassuring, transparent, modern British
- **Motion**: Subtle — 200ms ease-out transitions, no bouncy animations (respects field workers)

### Color Palette

| Role | Hex | Usage |
|------|-----|-------|
| Primary | `#059669` | CTAs, active states, primary actions (strong green — solar/nature) |
| Primary Light | `#10B981` | Hover states, secondary emphasis |
| Primary Dark | `#047857` | Pressed states |
| Secondary | `#0D9488` | Teal for informational elements |
| Accent/CTA | `#F97316` | Orange solar warmth — primary CTA buttons, important alerts |
| Background | `#F8FAFC` | Light grey — clean, professional |
| Surface | `#FFFFFF` | Cards, modals |
| Text Primary | `#0F172A` | Near-black — high contrast |
| Text Secondary | `#475569` | Muted — secondary info |
| Border | `#E2E8F0` | Subtle dividers |
| Success | `#059669` | (same as primary) |
| Warning | `#D97706` | Amber |
| Error | `#DC2626` | Red |
| On hold | `#7C3AED` | Purple |

### Typography

**Pairing: Plus Jakarta Sans (headings) + Inter (body)**

- Headings: Plus Jakarta Sans, 600-700 weight — approachable but professional
- Body: Inter, 400-500 weight — excellent readability at small sizes
- Mono: JetBrains Mono — for job references, IDs, codes

```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono&display=swap" rel="stylesheet">
```

### Anti-Patterns to Avoid

| Anti-Pattern | Severity | Avoid Because |
|-------------|----------|---------------|
| Generic "Loading..." spinners | HIGH | Use skeleton loaders for content, activity indicators for actions |
| Full-page takeovers for simple dialogs | MEDIUM | Use bottom sheets on mobile; modals only for critical confirmations |
| Date pickers that block content | MEDIUM | Use native date picker on mobile |
| Too many CTAs on one screen | HIGH | One primary CTA, one secondary max per screen |
| Photo upload without preview | HIGH | Users must confirm before uploading |
| Status shown only as text | MEDIUM | Use color-coded chips + icons for status |
| No empty states | HIGH | Show friendly illustration + action when no data |
| Form validation only on submit | MEDIUM | Validate inline on blur |

### 21st.dev Component Recommendations

For the admin portal, use shadcn/ui components from 21st.dev:
- `Card` — Job overview cards
- `Badge` — Status indicators
- `Button` — Primary actions (use green primary variant)
- `Input` / `Textarea` — Form fields
- `Select` / `Dropdown` — Role selection, status filter
- `Dialog` — Confirmations, photo review
- `Sheet` — Mobile-friendly side panel for job details
- `DataTable` — Job list, user management
- `Calendar` — Schedule management
- `Avatar` — User initials
- `Progress` — Upload progress
- `Skeleton` — Loading states
