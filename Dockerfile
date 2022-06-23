FROM nginx:alpine

COPY ./nginx/nginx.conf /etc/nginx/nginx.conf

WORKDIR /app

COPY ./app .

USER nobody

EXPOSE 80
