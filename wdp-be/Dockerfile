# Multi-stage build for NestJS backend

FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies for bcrypt
RUN apk add --no-cache python3 make g++

# Copy all source code
COPY packages/shared ./packages/shared
COPY wdp-be ./wdp-be
COPY package*.json ./

# Build shared package first
RUN cd packages/shared && npm install && npm run build

# Install backend dependencies from root (workspaces will handle linking)
WORKDIR /app
RUN npm install --legacy-peer-deps

# Build backend (try tsc directly to avoid webpack issues)
WORKDIR /app/wdp-be
RUN npx tsc -p tsconfig.build.json || npm run build

# Production image
FROM node:20-alpine AS production
WORKDIR /app

# Install bcrypt runtime dependencies
RUN apk add --no-cache python3 make g++

# Copy backend package file
COPY wdp-be/package*.json ./

# Copy built shared package
COPY --from=builder /app/packages/shared ./packages/shared

# Copy node_modules from builder
COPY --from=builder /app/wdp-be/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/wdp-be/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port
EXPOSE 8386

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8386/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/main"]
