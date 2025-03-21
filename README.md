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
  -e MENU_VERSION=2.0.84             `# optional` \
  -p 3000:3000                       `# sets webapp port` \
  -p 69:69/udp                       `# sets tftp port` \
  -p 8080:80                         `# optional` \
  -v /local/path/to/config:/config   `# optional` \
  -v /local/path/to/assets:/assets   `# optional` \
  --restart unless-stopped \
  netbootxyz-webapp
```

* Port 3000: Web Application
* Port 8080: NGINX Webserver for local asset hosting
* Port 69: TFTP server for menus/kpxe files

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


## Why this fork was created ?
I wanted to be able to hide the directory and its contents from the webapp so modified as i see fit.
It's not the greatest thing there but it works and it's all i need

Making it possible to hide directories from netbootxyz webapp with creating a file named 'disable-tracking-netbootxyz' in the folder, making it invisible in gui
In my case i have WinPE and extracted isos  in WinPE folder
```
assets
├───asset-mirror
│   └───releases
│       └───download
├───debian-core-10
│   └───releases
│       └───download
├───debian-core-11
│   └───releases
│       └───download
├───debian-core-12
│   └───releases
│       └───download
├───debian-squash
│   └───releases
│       └───download
├───fedora-assets
│   └───releases
│       └───download
├───manjaro-squash
│   └───releases
│       └───download
├───ssh
├───ubuntu-squash
│   └───releases
│       └───download
└───WinPE <- want to hide this folder and its contents
    ├───disable-tracking-netbootxyz (create file)
    ├───configs
    │   ├───Windows_10
    │   └───Windows_11
    ├───iso
    │   ├───Windows_10
    │   │   │ 
    │   │ [...]
    │   └───Windows_11
    │   │   │ 
    │   │ [...]
    ├───x64
    │   │
    │ [...]
    └───x86
        │
      [...]
```
Resulting with following folders visible to webapp
```
assets
├───asset-mirror
│   └───releases
│       └───download
├───debian-core-10
│   └───releases
│       └───download
├───debian-core-11
│   └───releases
│       └───download
├───debian-core-12
│   └───releases
│       └───download
├───debian-squash
│   └───releases
│       └───download
├───fedora-assets
│   └───releases
│       └───download
├───manjaro-squash
│   └───releases
│       └───download
├───ssh
└────ubuntu-squash
    └───releases
        └───download
```

