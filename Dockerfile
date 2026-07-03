# Stage 1: Build Frontend and Backend
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies using standard install
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Build the client-side SPA and compile the Express server via esbuild
# Change this line in your Dockerfile:
    RUN npm run build:backend

# Stage 2: Production Execution Environment
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=7860

# Install production dependencies only using standard install
COPY package*.json ./
RUN npm install --only=production

# Copy built assets and compiled CJS server from builder stage
COPY --from=builder /app/dist ./dist

# Create storage directory for backup state
RUN mkdir -p /app/data

# Expose server ingress port
EXPOSE 7860

# Launch server
CMD ["node", "dist/server.cjs"]