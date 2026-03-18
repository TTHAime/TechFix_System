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

```

### 3. Start PostgreSQL (Docker)

```bash
docker compose up -d
```

### 4. Generate Prisma Client & Push Schema

```bash
npx prisma generate
npx prisma db push
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
