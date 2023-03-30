# development stage
FROM node:14-alpine as base

# add OpenSSL and coreutils
RUN apk upgrade --update-cache --available && \
    apk add coreutils && \    
    apk add openssl && \
    rm -rf /var/cache/apk/*

WORKDIR /usr/src/app

COPY package.json yarn.lock tsconfig.json ecosystem.config.json ./


RUN ls -a

RUN yarn install --pure-lockfile

COPY ./src ./src

COPY ./keys ./keys

COPY ./images ./images

COPY ./signatures ./signatures

RUN yarn compile

# production stage

FROM base as production

WORKDIR /usr/prod/app

ENV NODE_ENV=production

COPY package.json yarn.lock ecosystem.config.json ./

RUN yarn install --production --pure-lockfile

COPY --from=base /usr/src/app/dist ./dist
