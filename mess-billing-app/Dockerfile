# syntax=docker.io/docker/dockerfile:1

FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Cache package dependencies layer
COPY package.json package-lock.json* ./
RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY package.json package-lock.json* ./
# Install all dependencies (including dev) for building
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js app
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Security: Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Security: Create non-root user with explicit UID/GID
# Using explicit numeric IDs ensures consistency across deployments
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application from builder stage
# --chown ensures new user owns files (prevents privilege escalation)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy minimal required dependencies
# We only need Prisma engines and client, not entire node_modules
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Copy production dependencies
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Create .next directory if it doesn't exist
RUN mkdir -p .next && chown -R nextjs:nodejs .next

# Expose port
EXPOSE 3000

# Set hostname to ensure binding to 0.0.0.0 (listen on all interfaces)
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Security: Run as non-root user (UID 1001:GID 1001)
# If container is compromised, attacker cannot gain root privileges
USER 1001:1001

# Healthcheck to ensure container is healthy
# This helps orchestration systems detect failed containers
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Run application
# Use exec form (array) instead of shell form for proper signal handling
CMD ["node", "server.js"]
