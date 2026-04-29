#!/bin/sh
# Reemplaza la variable ${BACKEND_URL} en la plantilla de Nginx
# con el valor real inyectado por Render en tiempo de ejecución
set -e

: "${BACKEND_URL:?La variable BACKEND_URL es requerida}"

envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template \
  > /etc/nginx/conf.d/default.conf

echo "Nginx configurado con BACKEND_URL=$BACKEND_URL (Internal Networking)"

exec nginx -g 'daemon off;'
