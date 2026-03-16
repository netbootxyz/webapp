#!/bin/bash

set -exo pipefail
SCRIPT_DIR="$(readlink -f "$(dirname -- "${BASH_SOURCE[0]}")")"

# Leave empty for standard flow or any other value for config recreate.
RECREATE_CONFIGURATION="${RECREATE_CONFIGURATION:-''}"

# make config, logs, nginx etc. dirs
mkdir -p /var/lib/nginx/tmp/client_body /var/tmp/nginx \
         /config/menus/remote     /config/menus/local \
         /config/nginx/site-confs /config/log/nginx /assets /run

# Check for file exisitance, and depending on environment replace/create/nothing
[[ -n "${RECREATE_CONFIGURATION}" ]] && \
    rm -f /config/nginx/nginx.conf /config/nginx/site-confs/*

[[ ! -f /config/nginx/nginx.conf ]] && \
    cp /defaults/nginx.conf /config/nginx/nginx.conf

[[ ! -f /config/nginx/site-confs/default ]] && \
    envsubst < /defaults/default > /config/nginx/site-confs/default

# Ownership
chown -R nbxyz:nbxyz /assets /var/lib/nginx /var/log/nginx

# download menus if not found
if [[ ! -f /config/menus/remote/menu.ipxe ]]; then
  echo "[netbootxyz-init] Downloading netboot.xyz at ${MENU_VERSION}"
  echo "[netbootxyz-init] Downloading Menus at ${MENU_VERSION}"
  curl -o /config/endpoints.yml -sL \
    "https://raw.githubusercontent.com/netbootxyz/netboot.xyz/${MENU_VERSION}/endpoints.yml"
  curl -o /tmp/menus.tar.gz -sL \
    "https://github.com/netbootxyz/netboot.xyz/releases/download/${MENU_VERSION}/menus.tar.gz"
  tar xf /tmp/menus.tar.gz -C /config/menus/remote

  # boot files
  echo "[netbootxyz-init] Downloading boot files at ${MENU_VERSION}"
  curl -o /config/menus/remote/netboot.xyz.kpxe \
       -sL "https://github.com/netbootxyz/netboot.xyz/releases/download/${MENU_VERSION}/netboot.xyz.kpxe"
  curl -o /config/menus/remote/netboot.xyz-undionly.kpxe \
       -sL "https://github.com/netbootxyz/netboot.xyz/releases/download/${MENU_VERSION}/netboot.xyz-undionly.kpxe"
  curl -o /config/menus/remote/netboot.xyz.efi \
       -sL "https://github.com/netbootxyz/netboot.xyz/releases/download/${MENU_VERSION}/netboot.xyz.efi"
  curl -o /config/menus/remote/netboot.xyz-snp.efi \
       -sL "https://github.com/netbootxyz/netboot.xyz/releases/download/${MENU_VERSION}/netboot.xyz-snp.efi"
  curl -o /config/menus/remote/netboot.xyz-snponly.efi \
       -sL "https://github.com/netbootxyz/netboot.xyz/releases/download/${MENU_VERSION}/netboot.xyz-snponly.efi"
  curl -o /config/menus/remote/netboot.xyz-arm64.efi \
       -sL "https://github.com/netbootxyz/netboot.xyz/releases/download/${MENU_VERSION}/netboot.xyz-arm64.efi"
  curl -o /config/menus/remote/netboot.xyz-arm64-snp.efi \
       -sL "https://github.com/netbootxyz/netboot.xyz/releases/download/${MENU_VERSION}/netboot.xyz-arm64-snp.efi"
  curl -o /config/menus/remote/netboot.xyz-arm64-snponly.efi \
       -sL "https://github.com/netbootxyz/netboot.xyz/releases/download/${MENU_VERSION}/netboot.xyz-arm64-snponly.efi"

  # layer and cleanup
  echo "[netbootxyz-init] layer and cleanup "

  echo -n "${MENU_VERSION}" > /config/menuversion.txt
  cp -r /config/menus/remote/* /config/menus
  rm -f /tmp/menus.tar.gz
fi

# Ownership
chown -R nbxyz:nbxyz /config
