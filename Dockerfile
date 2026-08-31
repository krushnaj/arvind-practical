# ==============================================================================
# Stage 1: Build React 19 Client
# ==============================================================================
FROM node:20-slim AS client-builder

WORKDIR /app/client

# Copy client dependency manifests
COPY client/package.json ./

# Install client dependencies
RUN npm install

# Copy client source code
COPY client/ ./

# Build production SPA assets into /app/client/dist
RUN npm run build

# ==============================================================================
# Stage 2: Production Server Runner
# ==============================================================================
FROM node:20-slim AS runner

WORKDIR /app

# Install native build tools (python3, make, g++) for node-gyp and wget for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ wget && rm -rf /var/lib/apt/lists/*

# Copy root dependency manifests
COPY package.json ./

# Install server production & build dependencies
RUN npm install

# Copy server code
COPY server/ ./server/

# Copy built frontend assets from client-builder
COPY --from=client-builder /app/client/dist ./client/dist

# Create runtime directories for SQLite DB and upload attachments
RUN mkdir -p /app/data /app/uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/app/data/inspections.db
ENV UPLOAD_DIR=/app/uploads

# Expose backend & SPA port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=5s \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

# Seed initial data if DB doesn't exist, then start production server
CMD ["sh", "-c", "npx tsx server/seed.ts && npx tsx server/index.ts"]

