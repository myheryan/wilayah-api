# Stage 1: Install dependencies
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
ENV HUSKY=0
RUN npm ci --legacy-peer-deps

# Stage 2: Build aplikasi
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ==========================================
# PERBAIKAN: Tangkap env var untuk Apollo di sini
# ==========================================
ARG NEXT_PUBLIC_GRAPHQL_URI
ENV NEXT_PUBLIC_GRAPHQL_URI=$NEXT_PUBLIC_GRAPHQL_URI

# LIMITASI RAM: Tambahkan flag max-old-space-size agar tidak 502
ENV NEXT_TELEMETRY_DISABLED 1
RUN NODE_OPTIONS="--max-old-space-size=768" npm run build

# Stage 3: Runner (Sangat Ringan)
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Ambil HANYA file yang dibutuhkan untuk running (Mode Standalone)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

# Jalankan server.js secara langsung (Lebih ringan daripada 'npm start')
CMD ["node", "server.js"]