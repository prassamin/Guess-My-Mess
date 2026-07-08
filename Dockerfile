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

# Backend port — overridden at runtime by docker-compose / Coolify env
ARG BACKEND_PORT=8000
ENV BACKEND_PORT=${BACKEND_PORT}

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set correct permissions
RUN mkdir .next && chown nextjs:nodejs .next

# Copy Next.js standalone files
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Backend files
COPY --from=deps --chown=nextjs:nodejs /app/server/node_modules ./server/node_modules
COPY --from=builder --chown=nextjs:nodejs /app/server ./server

# Expose both ports
EXPOSE 3000
EXPOSE ${BACKEND_PORT}

# Startup script: run backend and frontend concurrently
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'echo "Starting Backend on port $BACKEND_PORT..."' >> /start.sh && \
    echo 'cd /app/server && BACKEND_PORT=$BACKEND_PORT bun run src/index.ts & BACKEND_PID=$!' >> /start.sh && \
    echo 'echo "Starting Frontend..."' >> /start.sh && \
    echo 'cd /app && HOSTNAME="0.0.0.0" node server.js & FRONTEND_PID=$!' >> /start.sh && \
    echo 'wait -n $BACKEND_PID $FRONTEND_PID' >> /start.sh && \
    chmod +x /start.sh

USER nextjs

CMD ["/start.sh"]
