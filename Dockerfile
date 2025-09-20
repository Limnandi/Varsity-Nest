# multi-stage Dockerfile for Next.js (App Router)

ARG NODE_VERSION=22-alpine

# 1) Base with pnpm
FROM node:${NODE_VERSION} AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# 2) Install dependencies (cached)
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 3) Build
FROM base AS build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# 4) Runtime image
FROM node:${NODE_VERSION} AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copy standalone output if available; else copy .next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

# Fallback if standalone is not generated (Next 15 may still produce .next)
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules

USER 1001
EXPOSE 3000
ENV PORT=3000

# Use standalone server if present, else next start
CMD ["sh", "-c", "if [ -f server.js ]; then node server.js; else npx next start -p $PORT; fi"]


