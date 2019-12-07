Basic run example: 

```
docker run -d \
  -v <path to menu/config>:/config \
  -v <path to mirrored assets>:/assets `#optional` \
  -p 69:69/udp \
  -p 8080:80 \
  -p 3000:3000 \
  -p 8000:8000  \
  netbootxyz/webapp-dev
```

* Port 8000- Development interface
* Port 3000- Web Application
* Port 8080- NGINX Webserver for local asset hosting
* Port 69- TFTP server for menus/kpxe files