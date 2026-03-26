# Simple build for NestJS backend

FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ tzdata
ENV TZ=Asia/Ho_Chi_Minh

# Copy backend source
COPY wdp-be/package*.json ./
COPY wdp-be/tsconfig*.json ./
COPY wdp-be/src ./src

# Copy shared package (for file: dependency)
COPY packages/shared ./packages/shared
COPY packages/shared/package*.json ./packages/shared/

# Install shared dependencies and build
RUN cd packages/shared && npm install && npm run build

# Install backend dependencies
RUN npm install --legacy-peer-deps

# Build using tsc with tsconfig-paths to handle src/ imports
RUN npx -y tsc -p tsconfig.build.json

# Production image
FROM node:20-alpine
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache python3 make g++ tzdata
ENV TZ=Asia/Ho_Chi_Minh

# Copy package files
COPY wdp-be/package*.json ./

# Install production dependencies
RUN npm ci --production --legacy-peer-deps

# Copy shared package
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy built backend
COPY --from=builder /app/dist ./dist

# Install tsconfig-paths for runtime path resolution
RUN npm install tsconfig-paths

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port
EXPOSE 8386

# Use node -r to register tsconfig-paths for src/ imports
CMD ["node", "-r", "tsconfig-paths/register", "dist/main"]
