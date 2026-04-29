#!/bin/sh
# Reemplaza la variable ${BACKEND_URL} en la plantilla de Nginx
# con el valor real inyectado por Render en tiempo de ejecución
set -e

: "${BACKEND_URL:?La variable BACKEND_URL es requerida}"

export BACKEND_HOST=$(echo "$BACKEND_URL" | awk -F/ '{print $3}')

# Extraer el DNS interno del sistema para que Nginx pueda resolver hosts dinámicamente
export NAMESERVER=$(awk '/^nameserver/ {print $2; exit}' /etc/resolv.conf)

envsubst '${BACKEND_URL} ${BACKEND_HOST} ${NAMESERVER}' < /etc/nginx/conf.d/default.conf.template \
  > /etc/nginx/conf.d/default.conf

echo "Nginx configurado con BACKEND_URL=$BACKEND_URL, BACKEND_HOST=$BACKEND_HOST y NAMESERVER=$NAMESERVER"

exec nginx -g 'daemon off;'
