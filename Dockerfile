# ==============================================================================
# ANIMORA Clinic — All-in-One Docker Image (Next.js Standalone + Prisma + SQLite)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Install dependencies
# ------------------------------------------------------------------------------
FROM node:20-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ------------------------------------------------------------------------------
# Stage 2: Build application & prepare seeded SQLite template database
# ------------------------------------------------------------------------------
FROM node:20-slim AS builder
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/app/prisma/template.db"
ENV AUTH_SECRET="animora-build-time-placeholder-secret"
ENV APP_URL="http://localhost:3000"

RUN npx prisma generate \
  && npx prisma db push --skip-generate \
  && npm run db:seed \
  && npm run build

# ------------------------------------------------------------------------------
# Stage 3: Production all-in-one runner
# ------------------------------------------------------------------------------
FROM node:20-slim AS runner
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/animora.db"

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

# Copy Next.js standalone server, static assets, and public files
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Ensure custom Prisma client & Linux OpenSSL engine binary are always present
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Copy Prisma schema & pre-seeded clean SQLite template database
COPY --from=builder --chown=nextjs:nodejs /app/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma/template.db ./prisma/template.db

# Copy Node.js entrypoint (CRLF-safe across Windows/Linux)
COPY --chown=nextjs:nodejs docker-entrypoint.mjs ./docker-entrypoint.mjs

# Create persistent SQLite data directory with read/write permissions for nextjs (UID 1001)
RUN mkdir -p /app/data \
  && chown -R nextjs:nodejs /app/data \
  && chmod 775 /app/data

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "docker-entrypoint.mjs"]
