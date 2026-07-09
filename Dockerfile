FROM node:22-alpine

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
ENV AUTH_SECRET=build-placeholder
RUN npm run build

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production
ENV AUTH_TRUST_HOST=true

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && npm start"]
