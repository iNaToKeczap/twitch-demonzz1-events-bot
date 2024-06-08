FROM node:alpine

RUN mkdir /app
WORKDIR /app

COPY package.json /app
RUN npm install

COPY . /app
CMD ["/bin/sh", "-c", "set -e && npm start"]
