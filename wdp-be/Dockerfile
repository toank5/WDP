# Build for NestJS backend

FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies for native modules (bcrypt)
RUN apk add --no-cache python3 make g++ tzdata
ENV TZ=Asia_Ho_Chi_Minh

# Copy backend source
COPY wdp-be/package*.json ./
COPY wdp-be/tsconfig*.json ./
COPY wdp-be/src ./src

# Install dependencies
RUN npm install --legacy-peer-deps

# Build with Nest CLI (standard tsc build)
RUN npx nest build

# Production image
FROM node:20-alpine
WORKDIR /app

# Install runtime dependencies for native modules
RUN apk add --no-cache tzdata
ENV TZ=Asia_Ho_Chi_Minh

# Copy package files
COPY wdp-be/package*.json ./

# Install production dependencies
RUN npm install --production --legacy-peer-deps

# Copy built backend
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port
EXPOSE 8386

# Run the application
CMD ["node", "dist/main.js"]
