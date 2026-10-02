# Stage 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
RUN npm install --frozen-lockfile || npm install

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# Stage 2: Production runner
FROM node:22-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./
RUN npm install --only=production --frozen-lockfile || npm install --only=production

COPY --from=builder /usr/src/app/dist ./dist

# Create non-root user for security
USER node

EXPOSE 5000

CMD ["node", "dist/server.js"]
