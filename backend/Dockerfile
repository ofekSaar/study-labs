# ── Backend Dockerfile ───────────────────────
# Stage 1: Base (Install dependencies)
FROM node:20.12.2-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

# Stage 2: Development (For local development via compose)
FROM base AS development
# Create uploads directory and set permissions
RUN mkdir -p uploads && chmod 777 uploads
COPY --chown=node:node . .
USER node
EXPOSE 5000
CMD ["npm", "run", "dev"]

# Stage 3: Production (Production setup)
FROM base AS production
RUN mkdir -p uploads && chmod 777 uploads
COPY --chown=node:node . .
USER node
EXPOSE 5000
CMD ["npm", "start"]
