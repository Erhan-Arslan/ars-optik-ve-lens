FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY . .
# Prisma's config loader needs DATABASE_URL to resolve even for `generate`
# (no live connection is made) — the real value is supplied at container
# runtime via docker-compose, not baked into this build-time layer.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
RUN addgroup -S nodejs && adduser -S nestjs -G nodejs

COPY package.json package-lock.json ./
# NODE_ENV=production must not be set yet — npm treats it as an implicit
# --omit=dev during install, which would silently drop prisma/tsx (both
# devDependencies) that the entrypoint needs at boot for migrate/seed.
RUN npm ci
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/generated ./src/generated
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh && chown -R nestjs:nodejs /app

USER nestjs
EXPOSE 4000
ENTRYPOINT ["./docker-entrypoint.sh"]
