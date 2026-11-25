FROM node:22-alpine AS build
WORKDIR /app
ENV NG_CLI_ANALYTICS=false
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY . .
# API_URL entra no bundle via scripts/local-env.mjs (config "local"); sem ela, http://localhost:8080
ARG API_URL
RUN node scripts/local-env.mjs && npx ng build --configuration production,local

FROM nginx:alpine
# a imagem aplica envsubst nos templates e escreve em /etc/nginx/conf.d (usa $PORT)
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
ENV PORT=8080
EXPOSE 8080
