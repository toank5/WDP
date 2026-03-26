# Simple build for NestJS backend

FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ tzdata
ENV TZ=Asia/Ho_Chi_Minh

# Copy shared package first (needed for file: dependency)
COPY packages/shared ./packages/shared
COPY packages/shared/package*.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src

# Build shared package
RUN cd packages/shared && npm install && npm run build

# Copy backend source and configs
COPY wdp-be/package*.json ./
COPY wdp-be/tsconfig*.json ./
COPY wdp-be/src ./src

# Install backend dependencies
RUN npm install --legacy-peer-deps

# Override tsconfig.build.json with correct paths for Docker
RUN echo '{"extends":"./tsconfig.json","exclude":["node_modules","test","dist","**/*spec.ts"],"compilerOptions":{"paths":{"@eyewear/shared":["./packages/shared/dist/types"],"src/*":["./src/*"]},"outDir":"./dist","baseUrl":"./"}}' > tsconfig.build.json

# Build using tsc
RUN npx tsc -p tsconfig.build.json

# Check where main.js is
RUN find dist -name "main.js"

# Production image
FROM node:20-alpine
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache python3 make g++ tzdata
ENV TZ=Asia/Ho_Chi_Minh

# Copy package files and tsconfig
COPY wdp-be/package*.json ./
COPY wdp-be/tsconfig.json ./

# Install production dependencies
RUN npm install --production --legacy-peer-deps

# Copy shared package
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy built backend
COPY --from=builder /app/dist ./dist

# Install tsconfig-paths for runtime
RUN npm install tsconfig-paths

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port
EXPOSE 8386

CMD ["node", "-r", "tsconfig-paths/register", "dist/main.js"]
