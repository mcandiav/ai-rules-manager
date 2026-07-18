FROM node:22-alpine AS builder

ARG APP_VERSION=0.0.0
ARG GIT_HASH=dev

WORKDIR /app
COPY package.json ./
COPY apps/web/package.json ./apps/web/
RUN npm install

COPY VERSION ./VERSION
COPY apps/web/ ./apps/web/

ENV VITE_APP_RELEASE=${APP_VERSION}
ENV VITE_UI_VERSION=${GIT_HASH}

RUN npm run build -w apps/web

FROM nginx:alpine

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY docker/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
