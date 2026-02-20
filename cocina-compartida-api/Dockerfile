FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


FROM node:20-alpine

WORKDIR /app

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# ✅ Copiar carpeta uploads con las imágenes
COPY uploads ./uploads/

# ✅ Crear estructura de carpetas para uploads
RUN mkdir -p /app/uploads/avatars /app/uploads/recipes && \
    chmod -R 755 /app/uploads

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/main.js"]