FROM node:20-alpine

WORKDIR /app

COPY package.json .
RUN npm install

COPY . .
CMD ["/bin/sh", "-c", "set -e && npm start"]
