FROM node:20-alpine AS base

# Install bun globally so we can run the Elysia backend
RUN npm install -g bun

# 1. Install dependencies
FROM base AS deps
WORKDIR /app

# Install frontend dependencies
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN if [ -f package-lock.json ]; then npm ci; \
  elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else npm install; \
  fi

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
RUN npm run build

# 3. Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

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

# Expose both frontend and backend ports
EXPOSE 3000
EXPOSE 3001

# Create a startup script to run both processes
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'echo "Starting Elysia Backend..."' >> /start.sh && \
    echo 'cd /app/server && bun run src/index.ts & BACKEND_PID=$!' >> /start.sh && \
    echo 'echo "Starting Next.js Frontend..."' >> /start.sh && \
    echo 'cd /app && HOSTNAME="0.0.0.0" node server.js & FRONTEND_PID=$!' >> /start.sh && \
    echo 'wait -n $BACKEND_PID $FRONTEND_PID' >> /start.sh && \
    chmod +x /start.sh

USER nextjs

CMD ["/start.sh"]
