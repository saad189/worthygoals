# ── Build stage ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Runtime stage ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=prod

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Node as PID 1 never receives SIGTERM the way a normal process does — the
# kernel does not apply default signal handling to PID 1 — so `docker stop`
# and every rolling deploy waited out the full grace period and then
# SIGKILLed. tini reaps zombies and forwards signals, which is what makes
# enableShutdownHooks() in main.ts actually fire.
RUN apk add --no-cache tini

# node:20-alpine ships an unprivileged `node` user that went unused, so the
# process — and anything that escaped it — ran as uid 0. The app only reads
# /app, so no chown is needed.
USER node

EXPOSE 3000

# Readiness, not liveness: this hits Postgres, so a container that booted but
# cannot reach the database is reported unhealthy rather than served traffic.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "require('http').get({host:'127.0.0.1',port:process.env.PORT||3000,path:'/ready'},r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
