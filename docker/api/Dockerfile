FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN npm install

COPY apps/api/tsconfig.json ./apps/api/
COPY apps/api/src/ ./apps/api/src/
RUN npm run build -w apps/api

FROM node:22-alpine

WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/src/db/migrations ./dist/db/migrations
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./package.json

EXPOSE 8000
CMD ["node", "dist/server.js"]
