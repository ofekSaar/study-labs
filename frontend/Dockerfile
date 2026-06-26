# ── Frontend Multi-Stage Dockerfile ──────────────────
# Stage 1: Base (Install dependencies)
FROM node:20.12.2-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm install


# Stage 2: Development (For local development via compose)
FROM base AS development
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Stage 3: Builder (Create the production bundle)
FROM base AS builder
COPY . .
RUN npm run build

# Stage 4: Production (Serve with Nginx)
FROM nginx:1.25.4-alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
