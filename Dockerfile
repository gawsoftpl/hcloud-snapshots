FROM node:22-alpine

ENV PATH="/usr/src/app:${PATH}"

WORKDIR /project

COPY . .

RUN npm install

RUN apk update && apk add --no-cache curl bash

USER node
