FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
RUN corepack enable
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

FROM deps AS deps-prod
COPY prisma/ prisma/
RUN pnpm prune --prod

FROM deps AS builder
COPY src/ src/
COPY tsconfig.* .
COPY nest-cli.json .
COPY prisma/ prisma/
COPY prisma.config.ts .
RUN pnpm prisma generate
RUN pnpm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN corepack enable
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs
COPY --chown=nodejs:nodejs package.json .
COPY --chown=nodejs:nodejs pnpm-lock.yaml .
COPY --chown=nodejs:nodejs --from=deps-prod /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs --from=builder /app/dist ./dist
COPY --chown=nodejs:nodejs --from=builder /app/prisma ./prisma
COPY --chown=nodejs:nodejs --from=builder /app/prisma.config.ts ./prisma.config.ts
USER nodejs
EXPOSE 3000
CMD ["node", "dist/main"]