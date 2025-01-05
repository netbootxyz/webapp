# netboot.xyz webapp

This repo houses the netboot.xyz webapp that
provides a web interface for editing iPXE files
and downloading assets locally to the app.

The app is versioned over time and is integrated into the docker-netbootxyz
project located [here](https://github.com/netbootxyz/docker-netbootxyz).

## Building netboot.xyz webapp locally

Uses the docker-netbootxyz repo for source files to avoid duplication of configs:

```bash
git clone https://github.com/netbootxyz/webapp
cd webapp
git clone https://github.com/netbootxyz/docker-netbootxyz
docker build . -t netbootxyz-webapp
```

## Running it locally

```bash
docker run -d \
  --name=netbootxyz-webapp \
  -e MENU_VERSION=2.0.73             `# optional` \
  -p 3000:3000                       `# sets webapp port` \
  -p 69:69/udp                       `# sets tftp port` \
  -p 8080:80                         `# optional` \
  -v /local/path/to/config:/config   `# optional` \
  -v /local/path/to/assets:/assets   `# optional` \
  --restart unless-stopped \
  netbootxyz-webapp
```

* Port 3000- Web Application
* Port 8080- NGINX Webserver for local asset hosting
* Port 69- TFTP server for menus/kpxe files

## Running the latest webapp-dev build

To run the build that contains the latest commited changes:

```bash
docker run -d \
  --name=netbootxyz-webapp-dev \
  -e MENU_VERSION=2.0.84             `# optional` \
  -p 3000:3000                       `# sets webapp port` \
  -p 69:69/udp                       `# sets tftp port` \
  -p 8080:80                         `# optional` \
  -v /local/path/to/config:/config   `# optional` \
  -v /local/path/to/assets:/assets   `# optional` \
  --restart unless-stopped \
  ghcr.io/netbootxyz/webapp-dev:latest
```
