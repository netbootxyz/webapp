FROM alpine:3.18

# set version label
ARG BUILD_DATE="10/7/2024"
ARG VERSION="0.7.3"
ARG WEBAPP_VERSION="0.7.3"

LABEL org.opencontainers.image.authors="antony@mes.ser.li"
LABEL org.opencontainers.image.url="https://github.com/netbootxyz/webapp"
LABEL org.opencontainers.image.title="NetBoot.xyz WebApp"
LABEL org.opencontainers.image.description="NetBoot.xyz WebApp: A NodeJS helper application for managing local deployments of netboot.xyz"
LABEL org.opencontainers.image.documentation="https://netboot.xyz/docs/docker"
LABEL org.opencontainers.image.version="${WEBAPP_VERSION}"
LABEL org.opencontainers.image.vendor="https://NetBoot.xyz"
LABEL org.opencontainers.image.licenses="Apache-2.0 license"

RUN apk add --no-cache bash
SHELL ["/bin/bash", "-e", "-o", "pipefail", "-c"]

RUN \
 apk upgrade --no-cache && \
 apk add --no-cache --virtual=build-dependencies \
        nodejs npm && \
 echo "**** install runtime packages ****" && \
 apk add --no-cache \
        bash \
        busybox \
        curl \
        git \
        jq \
        nghttp2-dev \
        nginx \
        nodejs \
        shadow \
        sudo \
        supervisor \
        syslog-ng \
        tar \
        tftp-hpa && \
 groupmod -g 1000 users && \
 useradd -u 911 -U -d /config -s /bin/false nbxyz && \
 usermod -G users nbxyz && \
 mkdir /app \
       /config \
       /defaults

COPY . /app

RUN \
 npm install --prefix /app

ENV TFTPD_OPTS=''

EXPOSE 69/UDP 80/TCP 3000/TCP 8080/TCP
VOLUME ["/assets", "/config"]

COPY root/ /
CMD ["/start.sh"]
SHELL ["/bin/bash", "-c"]

# default command
ENTRYPOINT ["/start.sh"]
