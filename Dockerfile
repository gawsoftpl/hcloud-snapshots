FROM node:22-alpine

ENV PATH="/usr/src/app:${PATH}"

WORKDIR /project

COPY . .

RUN npm install

USER node
