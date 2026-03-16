FROM alpine:3.23.3

# set version label
ARG BUILD_DATE="10/9/2025"
ARG VERSION="0.7.4"
ARG WEBAPP_VERSION="0.7.4"

LABEL build_version="netboot.xyz version: ${VERSION} Build-date: ${BUILD_DATE}"
LABEL maintainer="antonym"

LABEL org.opencontainers.image.authors="antony@mes.ser.li"
LABEL org.opencontainers.image.url="https://github.com/netbootxyz/webapp"
LABEL org.opencontainers.image.title="NetBoot.xyz WebApp"
LABEL org.opencontainers.image.description="netboot.xyz official docker container - Your favorite operating systems in one place. A network-based bootable operating system installer based on iPXE."
LABEL org.opencontainers.image.documentation="https://netboot.xyz/docs/docker"
LABEL org.opencontainers.image.version="${WEBAPP_VERSION}"
LABEL org.opencontainers.image.vendor="https://NetBoot.xyz"
LABEL org.opencontainers.image.licenses="Apache-2.0 license"

RUN apk add --no-cache bash
SHELL ["/bin/bash", "-e", "-o", "pipefail", "-c"]

RUN \
 apk update && \
 apk upgrade && \
 apk add --no-cache \
   bash \
   busybox \
   curl \
   envsubst \
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
   tftp-hpa \
   dnsmasq && \
 apk add --no-cache --virtual=build-dependencies \
   npm && \
 groupmod -g 1000 users && \
 useradd -u 911 -U -d /config -s /bin/false nbxyz && \
 usermod -G users nbxyz && \
 mkdir /app \
       /config \
       /defaults

COPY . /app

RUN \
 npm install --prefix /app && \
 apk del --purge build-dependencies && \
 rm -rf /tmp/*

ENV TFTPD_OPTS=''
ENV NGINX_PORT='80'
ENV WEB_APP_PORT='3000'

EXPOSE 69/UDP 80/TCP 443/TCP
EXPOSE 3000/TCP 8080/TCP
VOLUME ["/assets", "/config"]

COPY root/ /

CMD ["/start.sh"]
SHELL ["/bin/bash", "-c"]

# default command
ENTRYPOINT ["/start.sh"]

