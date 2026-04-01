FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json .
COPY pnpm-lock.yaml .
RUN pnpm install --frozen-lockfile

FROM deps AS builder
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
COPY index.html .
COPY public/ public/
COPY src/ src/
COPY tsconfig*.json .
COPY vite.config.ts .
RUN pnpm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]