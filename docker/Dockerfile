# Stage 1: Base
FROM node:20-alpine AS base
WORKDIR /app

# Enable corepack (pnpm comes built-in with Node 20)
RUN corepack enable

# Stage 2: Dependencies
FROM base AS dependencies

# Copy only files needed for dependency resolution (for caching)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/nestjs-adapter/package.json ./packages/nestjs-adapter/
COPY apps/demo-api/package.json ./apps/demo-api/

RUN pnpm install --frozen-lockfile

# Stage 3: Build
FROM dependencies AS build

COPY . .
RUN pnpm run build

# Stage 4: Development
FROM dependencies AS development

ENV NODE_ENV=development

COPY . .
CMD ["pnpm", "run", "start:dev"]

# Stage 5: Production
FROM node:20-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

# Enable pnpm
RUN corepack enable

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy dependency manifests only
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/nestjs-adapter/package.json ./packages/nestjs-adapter/
COPY apps/demo-api/package.json ./apps/demo-api/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts only (not source code)
COPY --from=build /app/packages/core/dist ./packages/core/dist
COPY --from=build /app/packages/nestjs-adapter/dist ./packages/nestjs-adapter/dist
COPY --from=build /app/apps/demo-api/dist ./apps/demo-api/dist

# Switch to non-root user
USER appuser

EXPOSE 3000

CMD ["node", "apps/demo-api/dist/main.js"]