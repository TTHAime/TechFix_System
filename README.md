IT Equipment Maintenance Request System

# Backend

NestJS + Prisma + PostgreSQL

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/)

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Setup environment variables

Copy `.env.example` and rename to `.env`:

```bash
cp .env.example .env
```

ตั้งค่าตัวแปรใน `.env`:

```env
POSTGRES_USER=techfix
POSTGRES_PASSWORD=yourpassword
POSTGRES_DB=techfix_db
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}

JWT_SECRET=
PEPPER=
NODE_ENV=

# Google OAuth (SSO)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

#### Google OAuth Setup

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้าง Project ใหม่ (หรือเลือก project ที่มีอยู่)
3. ไปที่ **APIs & Services → OAuth consent screen** → เลือก External → กรอก App name, email
4. ไปที่ **APIs & Services → Credentials** → Create Credentials → **OAuth client ID**
5. เลือก Application type: **Web application**
6. เพิ่ม Authorized redirect URI: `http://localhost:3000/auth/google/callback`
7. Copy **Client ID** และ **Client Secret** ใส่ `.env`

Generate secrets using these commands:

```bash
# JWT secret (64 bytes, base64url — for HS512)
node -e "console.log(require('crypto').randomBytes(64).toString('base64url'))"

# Pepper secret (32 bytes minimum)
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

### 3. Start PostgreSQL (Docker)

```bash
docker compose up -d
```

### 4. Generate Prisma Client & Push Schema

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 5. Run the app

```bash
# development (watch mode)
pnpm run start:dev

# production
pnpm run build
pnpm run start:prod
```

## Useful Commands

| Command | Description |
|---|---|
| `npx prisma studio` | เปิด GUI จัดการข้อมูลใน DB |
| `npx prisma migrate dev` | สร้าง migration ใหม่ |
| `npx prisma db push` | Sync schema ไป DB (ไม่สร้าง migration) |
| `npx prisma generate` | Generate Prisma Client |
| `pnpm run test` | Run unit tests |
| `pnpm run test:e2e` | Run e2e tests |
