FROM node:22-alpine AS builder
WORKDIR /app
ARG VITE_API_URL=http://localhost:3000/api
ARG VITE_WS_URL=ws://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
COPY apps/web/package.json apps/web/yarn.lock ./
RUN yarn install --frozen-lockfile
COPY apps/web/ ./
RUN yarn build

FROM nginx:alpine AS runner
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
