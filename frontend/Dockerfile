# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Same-origin demo build: empty VITE_API_URL makes live-api call the serving
# origin directly; nginx.conf proxies /api and /ws to the backend container.
ENV VITE_API_URL=""

COPY package*.json ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
