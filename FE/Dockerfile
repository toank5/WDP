# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY FE/package*.json ./FE/
COPY packages/shared ./packages/shared
WORKDIR /app/FE
RUN npm install

COPY FE ./
RUN npm run build

# Runtime stage
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/FE/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]