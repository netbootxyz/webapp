FROM alpine:3.18

# set version label
ARG BUILD_DATE
ARG VERSION
ARG WEBAPP_VERSION
LABEL build_version="netboot.xyz version: ${VERSION} Build-date: ${BUILD_DATE}"
LABEL maintainer="antonym"

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
        tftp-hpa

RUN \
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

EXPOSE 3000
EXPOSE 8080

COPY root/ /

# default command
CMD ["sh","/start.sh"]
