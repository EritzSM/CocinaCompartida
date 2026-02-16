# CocinaCompartida

Descripción
-----------
CocinaCompartida es una plataforma web para compartir, descubrir y gestionar recetas de cocina. La aplicación incluye:
- Interfaz de usuario (Angular) para explorar recetas, subir contenido y gestionar perfiles.
- API REST (NestJS) que expone endpoints para autenticación, gestión de usuarios, recetas, comentarios y subida de imágenes.
- PostgreSQL como almacenamiento relacional y un volumen para `uploads` donde se guardan imágenes (avatares y fotos de recetas).

Arquitectura y tecnologías
--------------------------
- Frontend: Angular (TypeScript), RxJS, SweetAlert2.
- Backend: NestJS (TypeScript), TypeORM, JWT para autenticación, bcrypt para hashing.
- Base de datos: PostgreSQL.
- Servidor estático / proxy: nginx (contenedor `web`) sirve la SPA y proxifica `/api/` al backend.
- Almacenamiento de imágenes: archivos guardados en el volumen `api_uploads` y servidos vía nginx en `/uploads`.

Funcionalidades principales
---------------------------
- Registro, login y autenticación por token (JWT).
- Crear, editar y eliminar recetas (incluye imágenes).
- Subida de avatares y gestión de perfil.
- Comentarios y sistema de "me gusta" en recetas.
- Visualización de detalle de receta con carrusel de imágenes.

Ejecutar con Docker (recomendado)
--------------------------------
Prerrequisitos: `docker` y `docker compose` instalados.

1) Construir las imágenes y levantar los servicios:

```bash
cd D:/CocinaCompartida
docker compose build --no-cache
docker compose up -d
```

2) Parar y limpiar todo:

```bash
docker compose down -v
```

Puntos de acceso
-----------------
- Frontend (nginx): http://localhost:8081
- API backend (directo): http://localhost:3000

Nota: El frontend realiza peticiones a rutas relativas bajo `/api/`, por lo que nginx debe proxificar `/api/` al servicio `api`.

Variables de entorno (principales)
---------------------------------
Configura estas variables para el servicio `api` (archivo `.env` o en el entorno de Compose):

- `DB_HOST` (por defecto `db` en compose)
- `DB_PORT` (por defecto `5432`)
- `DB_USER` (por defecto `postgres`)
- `DB_PASSWORD` (por defecto `postgres`)
- `DB_NAME` (p. ej. `cocina`)
- `JWT_SECRET` (clave para tokens JWT)
- `PORT` (puerto del API, por defecto `3000`)

Volúmenes y puertos relevantes
-----------------------------
- Puerto frontend: `8081` (host) → `80` (contenedor `web`).
- Puerto backend: `3000` (host) → `3000` (contenedor `api`).
- Volúmenes: `api_uploads` (imágenes), `db_data` (datos PostgreSQL).

Depuración y logs
-----------------
- Ver logs en tiempo real:
  - `docker compose logs -f api`
  - `docker compose logs -f web`
- Si las imágenes no se muestran: comprobar que la ruta comience por `/uploads/` y que nginx esté devolviendo `Content-Type` correcto (`image/png`, `image/jpeg`).

Desarrollo sin contenedores
---------------------------
- Frontend:
  ```bash
  cd cocina-compartida
  npm install
  npm start
  ```
- Backend:
  ```bash
  cd cocina-compartida-api
  npm install
  cp .template.env .env
  npm run start:dev
  ```


