#!/bin/sh
# Reemplaza la variable ${BACKEND_URL} en la plantilla de Nginx
# con el valor real inyectado por Render en tiempo de ejecución
set -e

: "${BACKEND_URL:?La variable BACKEND_URL es requerida}"

# Extraer el host (ej. cocina-compartida-api.onrender.com) de la URL
export BACKEND_HOST=$(echo "$BACKEND_URL" | awk -F/ '{print $3}')

envsubst '${BACKEND_URL} ${BACKEND_HOST}' < /etc/nginx/conf.d/default.conf.template \
  > /etc/nginx/conf.d/default.conf

echo "Nginx configurado con BACKEND_URL=$BACKEND_URL y BACKEND_HOST=$BACKEND_HOST"

exec nginx -g 'daemon off;'
