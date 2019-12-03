FROM lsiobase/cloud9:alpine

RUN \
 echo "**** install build packages ****" && \
 apk add --no-cache --virtual=build-dependencies \
	curl \
	nodejs-npm && \
 echo "**** install runtime packages ****" && \
 apk add --no-cache \
	nodejs \
	git \
	sudo && \
 echo "**** install WebApp ****" && \
 git clone https://github.com/netbootxyz/webapp.git /code && \
 npm config set unsafe-perm true && \
 npm i npm@latest -g && \
 npm install --prefix /code && \
 npm install -g nodemon && \
 echo "**** cleanup ****" && \
 apk del --purge \
	build-dependencies && \
 rm -rf \
	/tmp/*

# copy local files
COPY root/ /

#App runs on port 3000 development interface on port 8000
EXPOSE 3000
EXPOSE 8000
