# TechFix — IT Equipment Maintenance Request System

ระบบแจ้งซ่อมอุปกรณ์ IT สำหรับองค์กร พัฒนาด้วย NestJS + React + PostgreSQL

---

## สารบัญ

- [System Architecture](#system-architecture)
- [Authentication Flow](#authentication-flow)
- [Authorization Design](#authorization-design)
- [Security Measures (OWASP Mapping)](#security-measures-owasp-mapping)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Useful Commands](#useful-commands)

---

## System Architecture


<img width="1920" height="1080" alt="Practical (2)" src="https://github.com/user-attachments/assets/e542eb6f-b1b1-4de6-8b96-309abcd5b4a2" />


### Deployment Architecture

ระบบใช้ Docker Compose จัดการ service ทั้งหมด:

| Service | Container | Description |
|---|---|---|
| `nginx` | `techfix_nginx` | Reverse proxy — route `/` ไป frontend, `/api/` ไป backend |
| `frontend` | `techfix_frontend` | React SPA (Vite build → static files) |
| `backend` | `techfix_backend` | NestJS REST API |
| `postgres` | `techfix_database` | PostgreSQL 17 Alpine + persistent volume |
| `migrator` | (on-demand) | รัน `prisma migrate deploy` สำหรับ production |
| `create-admin` | (on-demand) | สร้าง admin user คนแรกของระบบ |

### Backend Module Structure

```
backend/src/
├── auth/                 # Authentication module (login, OAuth, token refresh)
├── users/                # User management (CRUD, onboarding, profile)
├── repair-requests/      # Repair request lifecycle
├── equipment/            # Equipment inventory
├── equipment-categories/ # Equipment category management
├── departments/          # Department management
├── roles/                # Role definitions
├── request-status/       # Request status definitions
├── audit-logs/           # Audit trail (entity changes)
├── reports/              # Dashboard reports & analytics
├── common/               # Shared guards, decorators, pipes, filters, validators
├── prisma/               # PrismaModule & PrismaService
└── main.ts               # Bootstrap: Helmet, CORS, ValidationPipe, Logger
```

### Frontend Architecture

```
frontend/src/
├── pages/                # Route-level page components
├── components/           # Shared/reusable components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # App layout (sidebar, navbar)
│   └── common/           # Generic shared components
├── features/             # Feature-based modules
│   └── {feature}/
│       ├── api.ts        # API functions
│       ├── hooks.ts      # React Query hooks
│       ├── types.ts      # TypeScript types
│       └── components/   # Feature-specific UI
├── lib/                  # Axios instance, query client, utilities
├── stores/               # Zustand stores (auth, UI)
├── hooks/                # Shared custom hooks
└── types/                # Shared TypeScript types
```

---

## Authentication Flow

ระบบรองรับ 2 วิธีการเข้าสู่ระบบ: **Email/Password** และ **Google OAuth 2.0**

### 1. Email/Password Login

<img width="5180" height="4545" alt="Authentication Flow with-2026-04-04-050152" src="https://github.com/user-attachments/assets/9b4b93e7-4011-40c3-8b71-9fe0743b1270" />


### 2. Google OAuth 2.0 (SSO)

<img width="7755" height="5920" alt="Authentication Flow with-2026-04-04-050220" src="https://github.com/user-attachments/assets/d97ac4bd-e3e4-4657-ab3f-ea6b987ddc62" />


> **หมายเหตุ:** ผู้ใช้ต้องมี account ในระบบก่อน (สร้างโดย Admin/HR) จึงจะ login ผ่าน Google ได้ — ระบบจะ link `providerUid` กับ account ที่มีอยู่

### 3. Token Refresh (Silent Refresh)

<img width="5900" height="4005" alt="Authentication Flow with-2026-04-04-050312" src="https://github.com/user-attachments/assets/7b4ed8de-1035-41ce-a54a-7523ee0c74c3" />


- **Access Token:** เก็บใน memory (Zustand store) — ไม่เก็บใน localStorage
- **Refresh Token:** เก็บใน httpOnly cookie — JavaScript เข้าถึงไม่ได้
- **Token Rotation:** ทุกครั้งที่ refresh จะ revoke token เดิมและออก token ใหม่ ป้องกัน token theft
- **Frontend Auto-Refresh:** Axios interceptor จัดการ refresh อัตโนมัติเมื่อได้ 401 พร้อม request queue ป้องกัน race condition

### 4. Account Lockout (Brute Force Protection)

| Parameter | Value |
|---|---|
| Max failed attempts | 5 ครั้ง |
| Lock duration | 15 นาที |
| Reset on success | ใช่ — reset counter เมื่อ login สำเร็จ |

---

## Authorization Design

ระบบใช้ **Role-Based Access Control (RBAC)** ผ่าน custom guard และ decorator ของ NestJS

### Roles

| Role | Description |
|---|---|
| `admin` | ผู้ดูแลระบบ — เข้าถึงทุกฟังก์ชัน, จัดการผู้ใช้, assign ช่าง, ดู audit log |
| `hr` | ฝ่ายบุคคล — onboard พนักงานใหม่, จัดการ profile, สร้างใบแจ้งซ่อม |
| `technician` | ช่างเทคนิค — รับงานซ่อม, อัปเดตสถานะงาน, บันทึกผลการซ่อม |
| `user` | พนักงานทั่วไป — สร้างใบแจ้งซ่อม, ติดตามสถานะ, ยืนยันการซ่อมเสร็จ |

### RBAC Implementation

```typescript
// 1. Decorator — กำหนด role ที่อนุญาต
@Roles(Role.Admin, Role.HR)

// 2. Guard — ตรวจสอบ role ของ user จาก JWT payload
@UseGuards(JwtAuthGuard, RolesGuard)

// 3. Controller — ใช้งานร่วมกัน
@Patch(':id/profile')
@Roles(Role.Admin, Role.HR)
@UseGuards(JwtAuthGuard, RolesGuard)
updateProfile(@Param('id') id: string, @Body() dto: UpdateProfileDto) { ... }
```

### Endpoint Access Matrix

| Endpoint | Admin | HR | Technician | User |
|---|:---:|:---:|:---:|:---:|
| `POST /users` (สร้าง user) | ✅ | — | — | — |
| `POST /users/onboard` (onboard พนักงาน) | — | ✅ | — | — |
| `PATCH /users/:id/profile` (แก้ profile คนอื่น) | ✅ | ✅ (ชื่อกับแผนก) | — | — |
| `GET /users` (ดูรายชื่อทั้งหมด) | ✅ | ✅ | — | — |
| `DELETE /users/:id` (ปิดการใช้งาน) | ✅ | ✅ | — | — |
| `POST /repair-requests` (สร้างใบแจ้งซ่อม) | ✅ | ✅ | — | ✅ |
| `GET /repair-requests` (ดูใบแจ้งซ่อม) | ✅ (ทั้งหมด) | ✅ (ทั้งหมด) | ✅ (งานตัวเอง) | ✅ (ของตัวเอง) |
| `PATCH /.../assign` (มอบหมายงาน) | ✅ | — | — | — |
| `PATCH /.../accept` (รับงาน) | — | — | ✅ | — |
| `PATCH /.../resolve` (แจ้งซ่อมเสร็จ) | — | — | ✅ | — |
| `PATCH /.../confirm` (ยืนยันรับคืน) | ✅ (งานตัวเอง) | ✅ (งานตัวเอง) | — | ✅ (งานตัวเอง) |
| `PATCH /.../close` (ปิดใบแจ้งซ่อม) | ✅ | — | — | — |
| `GET /audit-logs` (ดู audit log) | ✅ | — | — | — |

### Business Rules เพิ่มเติม

- **HR ไม่สามารถแก้ไข/ลบ Admin** — ตรวจสอบใน service layer ก่อนทำ operation
- **User เห็นเฉพาะใบแจ้งซ่อมของตัวเอง** — filter ตาม `requesterId` ใน service
- **Technician เห็นเฉพาะงานที่ได้รับมอบหมาย** — filter ตาม `technicianId`
- **Soft Delete** — ไม่ลบ user จริง ใช้ `isActive: false` เพื่อรักษา referential integrity

---

## Security Measures (OWASP Mapping)

การออกแบบความปลอดภัยของระบบ mapping กับ [OWASP Top 10 (2025)](https://owasp.org/Top10/2025/)

### A01:2025 — Broken Access Control

| มาตรการ | รายละเอียด |
|---|---|
| RBAC Guard | ทุก endpoint ป้องกันด้วย `JwtAuthGuard` + `RolesGuard` |
| Role-based data filtering | User/Technician เห็นเฉพาะข้อมูลที่เกี่ยวข้องกับตัวเอง |
| Business rule enforcement | HR ไม่สามารถแก้ไข Admin, ตรวจสอบ ownership ก่อนทำ operation |
| CORS restriction | อนุญาตเฉพาะ origin ที่กำหนดใน `CORS_ORIGIN` env |
| CSRF Origin Guard | ตรวจ `Origin`/`Referer` header บน login/refresh endpoint — บล็อก cross-site form submission (OWASP recommended) |
| Soft delete | ป้องกันการลบข้อมูลถาวรโดยไม่ตั้งใจ |

### A02:2025 — Security Misconfiguration

| มาตรการ | รายละเอียด |
|---|---|
| Helmet.js | ตั้ง security headers อัตโนมัติ (X-Content-Type-Options, X-Frame-Options, HSTS ฯลฯ) |
| CORS | จำกัด origin ที่อนุญาตผ่าน env variable |
| Environment variables | Secrets ทั้งหมด (JWT_SECRET, PEPPER, DB password) อยู่ใน `.env` — ไม่ hardcode |
| Docker isolation | แต่ละ service รันใน container แยก มี network isolation |
| ValidationPipe strict mode | `forbidUnknownValues: true` — reject payload ที่มี field ไม่รู้จัก |

### A03:2025 — Software Supply Chain Failures

| มาตรการ | รายละเอียด |
|---|---|
| pnpm lockfile | `pnpm-lock.yaml` ล็อก dependency versions — ป้องกัน dependency confusion |
| Docker pinned images | ใช้ image tag ที่ระบุ version ชัดเจน (เช่น `postgres:17-alpine`) |
| Prisma migrations | Schema changes ผ่าน migration system — trackable และ reversible |
| No user-controlled dependencies | ไม่รับ package name / URL จาก user input |

### A04:2025 — Cryptographic Failures

| มาตรการ | รายละเอียด |
|---|---|
| Argon2id | ใช้ Argon2id (OWASP recommended) สำหรับ hash password — memory: 64 MB, iterations: 3 |
| Pepper | เพิ่ม secret pepper (32+ bytes) จาก environment variable ก่อน hash |
| JWT HS512 | ใช้ secret 64 bytes (base64url) สำหรับ sign JWT |
| Refresh token hash | เก็บ SHA-256 hash ใน DB — ไม่เก็บ raw token |
| httpOnly cookie | Refresh token ส่งผ่าน httpOnly cookie เท่านั้น — JS เข้าถึงไม่ได้ |
| Secure flag | ใช้ `secure: true` ใน production — ส่ง cookie ผ่าน HTTPS เท่านั้น |

### A05:2025 — Injection

| มาตรการ | รายละเอียด |
|---|---|
| Prisma ORM | ใช้ parameterized queries ตลอด — ป้องกัน SQL injection |
| Global ValidationPipe | `whitelist: true`, `forbidNonWhitelisted: true` — strip/reject unknown fields |
| class-validator DTOs | ทุก request body ต้องผ่าน DTO validation ก่อนเข้า service |
| HTML Sanitization | ใช้ `sanitize-html` ผ่าน `@Sanitize()` decorator — ลบ HTML tags ทั้งหมดจาก input |
| Email normalization | `.toLowerCase()` + `@IsEmail()` validation |

### A06:2025 — Insecure Design

| มาตรการ | รายละเอียด |
|---|---|
| Account lockout | ล็อก account หลัง 5 ครั้งที่ login ผิด เป็นเวลา 15 นาที |
| Token rotation | Refresh token ถูก revoke ทุกครั้งที่ใช้ — ป้องกัน token replay |
| Audit logging | ทุกการเปลี่ยนแปลง entity (create/update/delete) บันทึกใน audit_logs พร้อม old/new values |
| Status & Assignment logs | บันทึกประวัติการเปลี่ยนสถานะและการมอบหมายงานทั้งหมด |
| Separation of concerns | Business logic อยู่ใน service layer, controller เป็นแค่ thin layer |

### A07:2025 — Authentication Failures

| มาตรการ | รายละเอียด |
|---|---|
| Strong password policy | ขั้นต่ำ 15 ตัวอักษร, สูงสุด 64, ต้องมี uppercase + lowercase + ตัวเลข + อักขระพิเศษ, ตรวจความแข็งแกร่งด้วย zxcvbn (score ≥ 3) |
| Short-lived access token | หมดอายุใน 15 นาที — ลด window of attack |
| Token in memory only | Access token เก็บใน Zustand (memory) — ไม่เก็บใน localStorage/sessionStorage |
| Google OAuth 2.0 | รองรับ SSO — ลดความเสี่ยงจาก password reuse |
| SameSite cookie | `sameSite: 'lax'` ป้องกัน cross-site cookie transmission |
| CSRF Origin Guard | `CsrfOriginGuard` ตรวจ `Origin`/`Referer` header บน endpoint ที่ไม่มี JWT (login, refresh) — บล็อก cross-site request forgery |

### A08:2025 — Software or Data Integrity Failures

| มาตรการ | รายละเอียด |
|---|---|
| Prisma migrations | Schema changes ผ่าน migration system — trackable และ reversible |
| Docker build | Deterministic builds ผ่าน Dockerfile — reproducible deployments |
| pnpm lockfile | `pnpm-lock.yaml` ล็อก dependency versions |

### A09:2025 — Security Logging and Alerting Failures

| มาตรการ | รายละเอียด |
|---|---|
| Structured logging (Pino) | ทุก HTTP request ถูก log พร้อม request ID, method, URL, status, duration |
| Sensitive field redaction | Authorization header และ cookies ถูก redact จาก log |
| Audit trail | Entity changes → `audit_logs`, Status changes → `status_logs`, Assignments → `assignment_logs` |
| Error logging | 5xx errors ถูก log พร้อม stack trace |
| Log levels | ใช้ log level ที่เหมาะสม (info, warn, error) ตั้งค่าผ่าน `LOG_LEVEL` env |

### A10:2025 — Mishandling of Exceptional Conditions

| มาตรการ | รายละเอียด |
|---|---|
| Global exception filter | NestJS `HttpExceptionFilter` จัดการ error ทุกประเภท — ไม่ expose stack trace ใน production |
| Consistent error response | ทุก error response ใช้ format เดียวกัน `{ statusCode, message }` — ไม่รั่วข้อมูล internal |
| No outbound user-URL fetch | Backend ไม่ fetch URL จาก user input — ป้องกัน SSRF |
| Google OAuth fixed callback | OAuth callback URL กำหนดตายตัวใน env — ไม่รับ redirect URL จาก client |
| Nginx reverse proxy | Client ไม่เข้าถึง backend/database โดยตรง |

---

## Tech Stack

### Backend

| Layer | Technology |
|---|---|
| Framework | NestJS 11 + TypeScript |
| Database | PostgreSQL 17 (Alpine) |
| ORM | Prisma 7.5.0 |
| Authentication | Passport.js (JWT + Local + Google OAuth 2.0) |
| Password Hashing | Argon2id + Pepper |
| Password Strength | zxcvbn (realistic entropy scoring) |
| Security Headers | Helmet 8.1.0 |
| Rate Limiting | @nestjs/throttler (60 req/60s) |
| Validation | class-validator + class-transformer |
| Sanitization | sanitize-html 2.17.2 |
| Logging | nestjs-pino + pino-http |
| Testing | Jest 30 + Supertest |
| Excel Export | ExcelJS 4.4.0 |

### Frontend

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| Routing | React Router 7 |
| Server State | TanStack React Query 5 |
| Client State | Zustand 5 |
| Forms | Formik 2 + Yup |
| HTTP Client | Axios 1.13 |
| UI Components | shadcn/ui (Radix UI) |
| Styling | Tailwind CSS 4 |
| Charts | Recharts 3 |
| Icons | Lucide React |
| Notifications | Sonner |
| Error Handling | react-error-boundary |

### Infrastructure

| Layer | Technology |
|---|---|
| Container | Docker + Docker Compose |
| Reverse Proxy | Nginx Alpine |
| Database | PostgreSQL 17 Alpine (persistent volume) |
| Package Manager | pnpm |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/)

### 1. Clone & Install

```bash
git clone <repository-url>
cd final_project

# Install backend dependencies
cd backend && pnpm install && cd ..

# Install frontend dependencies
cd frontend && pnpm install && cd ..
```

### 2. Setup Environment Variables

```bash
cp backend/.env.example backend/.env
```

ตั้งค่าใน `backend/.env`:

```env
POSTGRES_USER=techfix
POSTGRES_PASSWORD=yourpassword
POSTGRES_DB=techfix_db
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}

JWT_SECRET=
PEPPER=
NODE_ENV=development

# Google OAuth (SSO)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```

สร้าง secrets:

```bash
# JWT secret (64 bytes, base64url — สำหรับ HS512)
node -e "console.log(require('crypto').randomBytes(64).toString('base64url'))"

# Pepper secret (32 bytes minimum)
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

#### Google OAuth Setup

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้าง Project ใหม่ (หรือเลือก project ที่มีอยู่)
3. ไปที่ **APIs & Services → OAuth consent screen** → เลือก External → กรอก App name, email
4. ไปที่ **APIs & Services → Credentials** → Create Credentials → **OAuth client ID**
5. เลือก Application type: **Web application**
6. เพิ่ม Authorized redirect URI: `http://localhost:3000/auth/google/callback`
7. Copy **Client ID** และ **Client Secret** ใส่ `.env`

### 3. Start PostgreSQL (Docker)

```bash
docker compose up postgres -d
```

### 4. Setup Database

```bash
cd backend
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

### 5. Run Development Servers

```bash
# Terminal 1 — Backend (http://localhost:3000)
cd backend
pnpm run start:dev

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend
pnpm run dev
```

### Production (Docker Compose)

```bash
# Start ทุก service
docker compose up -d

# Run migrations (ครั้งแรก)
docker compose --profile migrate up migrator

# Create admin user (ครั้งแรก)
docker compose --profile create-admin up create-admin
```

ระบบจะพร้อมใช้งานที่ `http://localhost`

---

## Useful Commands

### Backend

| Command | Description |
|---|---|
| `pnpm run start:dev` | Start backend (watch mode) |
| `pnpm run build` | Build สำหรับ production |
| `pnpm run test` | Run unit tests |
| `pnpm run test:e2e` | Run e2e tests |
| `pnpm run test:cov` | Run tests with coverage |
| `pnpm run lint` | Lint & fix code |

### Frontend

| Command | Description |
|---|---|
| `pnpm run dev` | Start frontend dev server |
| `pnpm run build` | Build สำหรับ production |
| `pnpm run lint` | Lint code |
| `pnpm run preview` | Preview production build |

### Prisma

| Command | Description |
|---|---|
| `npx prisma studio` | เปิด GUI จัดการข้อมูลใน DB |
| `npx prisma migrate dev` | สร้าง migration ใหม่ |
| `npx prisma migrate deploy` | Apply migrations (production) |
| `npx prisma db push` | Sync schema ไป DB (ไม่สร้าง migration) |
| `npx prisma generate` | Generate Prisma Client |
| `npx prisma db seed` | Seed ข้อมูลเริ่มต้น |

### Docker

| Command | Description |
|---|---|
| `docker compose up -d` | Start ทุก service |
| `docker compose down` | Stop ทุก service |
| `docker compose logs -f backend` | ดู backend logs |
| `docker compose --profile migrate up migrator` | Run database migrations |
| `docker compose --profile create-admin up create-admin` | สร้าง admin user |
