# ---------- Stage 1: Dependencies ----------
FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci


# ---------- Stage 2: Build ----------
FROM node:22-alpine AS builder

WORKDIR /app

# NEXT_PUBLIC_* ถูกฝังตอน build จึงต้องส่งเป็น build args
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_BASE_PATH
ARG NEXT_PUBLIC_GOOGLE_ANALYTICS
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH \
    NEXT_PUBLIC_GOOGLE_ANALYTICS=$NEXT_PUBLIC_GOOGLE_ANALYTICS \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build


# ---------- Stage 3: Production ----------
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=4100 \
    HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 4100

CMD ["node", "server.js"]
