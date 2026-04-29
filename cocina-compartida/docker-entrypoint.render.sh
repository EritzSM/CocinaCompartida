#!/bin/sh
# Reemplaza la variable ${BACKEND_URL} en la plantilla de Nginx
# con el valor real inyectado por Render en tiempo de ejecución
set -e

: "${BACKEND_URL:?La variable BACKEND_URL es requerida}"

# Extraer el DNS interno del sistema para que Nginx pueda resolver hosts dinámicamente
export NAMESERVER=$(awk '/^nameserver/ {print $2; exit}' /etc/resolv.conf)

envsubst '${BACKEND_URL} ${NAMESERVER}' < /etc/nginx/conf.d/default.conf.template \
  > /etc/nginx/conf.d/default.conf

echo "Nginx configurado con BACKEND_URL=$BACKEND_URL y NAMESERVER=$NAMESERVER"

exec nginx -g 'daemon off;'
