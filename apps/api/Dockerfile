# Multi-stage production Dockerfile for Mimic Manager API & In-Process Worker
# Base pinned digest for Node 22 Alpine (x86_64 / arm64 reproducible)
FROM node:22-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914 AS base

# Install PNPM globally
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@12.16.1 --activate

# Stage 1: Build packages and application
FROM base AS builder
WORKDIR /app

# Install native dependencies required for node-gyp & sharp
RUN apk add --no-cache python3 make g++ vips-dev

# Copy package manifests and workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/config/package.json ./packages/config/
COPY packages/types/package.json ./packages/types/
COPY packages/ssrf-guard/package.json ./packages/ssrf-guard/
COPY packages/ui/package.json ./packages/ui/
COPY packages/ir/package.json ./packages/ir/
COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/

# Install dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile

# Copy source trees
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
COPY apps/worker/ ./apps/worker/

# Build libraries and API
RUN pnpm --filter @mimic-manager/types build
RUN pnpm --filter @mimic-manager/ssrf-guard build
RUN pnpm --filter @mimic-manager/worker build
RUN pnpm --filter @mimic-manager/api build

# Prune devDependencies for production runtime
RUN pnpm prune --prod

# Stage 2: Minimal hardened production runner
FROM base AS runner
WORKDIR /app

# Install runtime sharp dependencies and curl for healthcheck
RUN apk add --no-cache vips curl

# Production environment variables
ENV NODE_ENV=production
ENV PORT=10000
ENV IN_PROCESS_WORKER=true
ENV STORAGE_DRIVER=local
ENV STORAGE_PATH=/tmp/mimic-manager/storage
ENV NODE_OPTIONS="--max-old-space-size=450"

# Create storage directory and set non-root ownership
RUN mkdir -p /tmp/mimic-manager/storage && \
    chown -R node:node /tmp/mimic-manager /app

# Copy production artifacts from builder
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/packages ./packages
COPY --from=builder --chown=node:node /app/apps/api ./apps/api
COPY --from=builder --chown=node:node /app/apps/worker ./apps/worker
COPY --from=builder --chown=node:node /app/package.json ./package.json

# Run as non-root user
USER node

# Healthcheck targeting liveness probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -fsS http://127.0.0.1:${PORT:-10000}/health || exit 1

EXPOSE 10000 3000

# Start API gateway with in-process worker
CMD ["node", "apps/api/dist/main.js"]
