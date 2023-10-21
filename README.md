# netboot.xyz webapp

This repo houses the netboot.xyz webapp that
provides a web interface for editing iPXE files
and downloading assets locally to the app.

## Building netboot.xyz webapp locally

```bash
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
