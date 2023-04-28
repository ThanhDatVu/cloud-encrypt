# development stage
FROM node:14-alpine as base

# add coreutils
RUN apk upgrade --update-cache --available && \
    apk add coreutils && \    
    rm -rf /var/cache/apk/*

# add build tools
RUN set -x \
    && apk add --no-cache \
    bash \
    wget \
    gcc \
    tar \
    alpine-sdk \
    perl \
    linux-headers \
    && rm -rf /var/cache/apk/*

ENV OPENSSL_VERSION="3.0.8"

RUN set -x \
    ### BUILD OpenSSL
    && wget --no-check-certificate -O /tmp/openssl-${OPENSSL_VERSION}.tar.gz "https://www.openssl.org/source/openssl-${OPENSSL_VERSION}.tar.gz" \
    && tar -xvf /tmp/openssl-${OPENSSL_VERSION}.tar.gz -C /tmp/ \
    && rm -rf /tmp/openssl-${OPENSSL_VERSION}.tar.gz
COPY bf_local.h /tmp/openssl-${OPENSSL_VERSION}/crypto/bf/bf_local.h
RUN cd /tmp/openssl-${OPENSSL_VERSION} \
    && ./Configure linux-x86_64 shared\
    && make \
    && make install \
    && cd .. \
    && cat /tmp/openssl-${OPENSSL_VERSION}/crypto/bf/bf_local.h 

ENV PATH /usr/local/ssl/bin:$PATH


WORKDIR /usr/src/app

COPY package.json yarn.lock tsconfig.json ecosystem.config.json ./


RUN ls -a

RUN yarn install --pure-lockfile

COPY ./src ./src

COPY ./keys ./keys

COPY ./images ./images

COPY ./signatures ./signatures

COPY ./images_test ./images_test

RUN yarn compile

# production stage

FROM base as production

WORKDIR /usr/prod/app

ENV NODE_ENV=production

COPY package.json yarn.lock ecosystem.config.json ./

RUN yarn install --production --pure-lockfile

COPY --from=base /usr/src/app/dist ./dist
