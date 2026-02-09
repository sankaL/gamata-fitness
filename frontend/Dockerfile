FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/runtime-env.sh /docker-entrypoint.d/40-runtime-env.sh

RUN chmod +x /docker-entrypoint.d/40-runtime-env.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
