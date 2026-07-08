FROM node:20-alpine AS base

# Install bun globally so we can run the Elysia backend
RUN npm install -g bun

# 1. Install dependencies
FROM base AS deps
WORKDIR /app

# Install frontend dependencies
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Install backend dependencies
WORKDIR /app/server
COPY server/package.json server/bun.lockb* ./
RUN bun install

# 2. Build Next.js
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# 3. Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV XDG_DATA_HOME=/tmp/caddy

# Backend port — overridden at runtime by docker-compose / Coolify env
ARG BACKEND_PORT=8000
ENV BACKEND_PORT=${BACKEND_PORT}

# Install Caddy reverse proxy (handles WebSocket transparently)
RUN apk add --no-cache caddy

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set correct permissions
RUN mkdir .next && chown nextjs:nodejs .next
RUN mkdir -p /tmp/caddy && chown nextjs:nodejs /tmp/caddy

# Copy Next.js standalone files
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Backend files
COPY --from=deps --chown=nextjs:nodejs /app/server/node_modules ./server/node_modules
COPY --from=builder --chown=nextjs:nodejs /app/server ./server

# Copy Caddy reverse proxy config
COPY --chown=nextjs:nodejs Caddyfile ./Caddyfile

# Only port 3000 is exposed — Caddy routes everything internally
EXPOSE 3000

# Startup script: run backend, frontend, and Caddy reverse proxy
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'echo "Starting Backend on port $BACKEND_PORT..."' >> /start.sh && \
    echo 'cd /app/server && BACKEND_PORT=$BACKEND_PORT bun run src/index.ts &' >> /start.sh && \
    echo 'echo "Starting Frontend on port 3001..."' >> /start.sh && \
    echo 'cd /app && PORT=3001 HOSTNAME="0.0.0.0" node server.js &' >> /start.sh && \
    echo 'echo "Starting Caddy reverse proxy on port 3000..."' >> /start.sh && \
    echo 'caddy run --config /app/Caddyfile &' >> /start.sh && \
    echo 'trap "kill \$(jobs -p) 2>/dev/null" EXIT' >> /start.sh && \
    echo 'wait' >> /start.sh && \
    chmod +x /start.sh

USER nextjs

CMD ["/start.sh"]
