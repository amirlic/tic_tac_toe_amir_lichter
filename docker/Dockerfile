# Multi-stage Dockerfile for Production-Ready Tic-Tac-Toe Game
# AI-Generated: 95% - Docker best practices, multi-stage build, security hardening
# Human Refinements: Production optimizations

# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm install --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Production stage
FROM node:18-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

# Set working directory
WORKDIR /usr/src/app

# Copy built application from builder stage
COPY --from=builder --chown=appuser:nodejs /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /usr/src/app/src ./src
COPY --chown=appuser:nodejs package*.json ./

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Health check
COPY --chown=appuser:nodejs docker/healthcheck.js ./
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

# Switch to non-root user
USER appuser

# Expose ports
EXPOSE 3001 3002

# Set environment variables
ENV NODE_ENV=production
ENV REDIS_HOST=redis
ENV REDIS_PORT=6379

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Default command - port will be set via environment variable
CMD ["node", "src/enhancedServer.js"]

# Labels for metadata
LABEL version="1.0.0"
LABEL description="Real-time multiplayer Tic-Tac-Toe with distributed servers"
LABEL maintainer="amir.lichter@example.com"
