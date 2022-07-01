FROM node:alpine as builder

WORKDIR /app

ADD . .

RUN npm ci -D
RUN npm run build

# production container
FROM node:alpine
ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /app/build .
COPY --from=builder /app/package.json .
COPY --from=builder /app/package-lock.json .

RUN npm ci

USER nobody

EXPOSE 8080
CMD ["node", "main.js"]