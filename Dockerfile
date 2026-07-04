# Stage 1: Build Frontend and Backend
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application source code
COPY . .

# Build the client-side SPA and compile the Express server via esbuild
RUN npm run build

# Stage 2: Production Execution Environment
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=7860

# Install production dependencies only to minimize image size and attack surface
COPY package*.json ./
RUN npm ci --only=production

# Copy built assets and compiled CJS server from builder stage
COPY --from=builder /app/dist ./dist

# Create storage directory for backup state (if needed, though we will move to cloud DB)
RUN mkdir -p /app/data

# Expose server ingress port
EXPOSE 7860

# Launch server
CMD ["node", "dist/server.cjs"]
