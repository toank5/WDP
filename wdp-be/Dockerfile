# Multi-stage build for NestJS backend

FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies for bcrypt
RUN apk add --no-cache python3 make g++ tzdata
ENV TZ=Asia/Ho_Chi_Minh

# Copy all source code
COPY packages/shared ./packages/shared
COPY wdp-be ./wdp-be
COPY package*.json ./

# Build shared package first
RUN cd packages/shared && npm install && npm run build

# Install backend dependencies from root (workspaces will handle linking)
WORKDIR /app
RUN npm install --legacy-peer-deps

# Build backend using nest CLI from root node_modules
RUN ./node_modules/.bin/nest build --project ./wdp-be

# Verify dist was created
RUN ls -la wdp-be/dist/ && test -f wdp-be/dist/main.js

# Production image
FROM node:20-alpine AS production
WORKDIR /app

# Install bcrypt runtime dependencies
RUN apk add --no-cache python3 make g++ tzdata
ENV TZ=Asia/Ho_Chi_Minh

# Copy only backend package.json (no workspace complexity)
COPY wdp-be/package*.json ./

# Install all dependencies
RUN npm install --legacy-peer-deps

# Copy built shared package and its dependencies
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy built application
COPY --from=builder /app/wdp-be/dist ./dist

# Verify dist was copied
RUN ls -la dist/ && test -f dist/main.js

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
