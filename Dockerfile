FROM node:alpine

WORKDIR /app

COPY ./app .

USER nobody

EXPOSE 80

CMD ["node", "main.js"]