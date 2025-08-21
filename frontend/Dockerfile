# Frontend Dockerfile (Next.js)
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ARG BACKEND_URL=http://backend:8001
ENV BACKEND_URL=${BACKEND_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build the Next.js app (config can read BACKEND_URL at runtime when starting)
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Copy built app and runtime deps
COPY --from=builder /app ./
EXPOSE 3001
ENV PORT=3001
# BACKEND_URL is provided via docker-compose at runtime
CMD ["npm", "run", "start"]
