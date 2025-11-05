# CocinaCompartida

## Descripción

CocinaCompartida es una aplicación web full-stack que permite a los usuarios descubrir, compartir y disfrutar de recetas culinarias. La plataforma conecta a amantes de la comida ("foodies") para que puedan subir sus creaciones, explorar recetas de otros usuarios y gestionar su perfil personal. El frontend está desarrollado con Angular y el backend con NestJS, utilizando PostgreSQL como base de datos y Supabase para almacenamiento de imágenes.

## Características

- **Inicio (Home)**: Página principal con recetas destacadas y acceso rápido a explorar o crear nuevas recetas.
- **Explorar (Explore)**: Navega y busca entre todas las recetas disponibles en la plataforma.
- **Subir Receta (Recipe Upload)**: Permite a los usuarios autenticados crear y publicar nuevas recetas con imágenes, descripciones e instrucciones.
- **Detalle de Receta (Recipe Detail)**: Vista detallada de una receta específica, incluyendo ingredientes, pasos y información del autor.
- **Perfil (Profile)**: Gestión del perfil de usuario, incluyendo información personal y recetas publicadas.
- **Autenticación**: Sistema de login y registro para usuarios.
- **Interfaz Responsiva**: Diseño adaptativo para dispositivos móviles y de escritorio.

## Tecnologías Utilizadas

### Frontend
- **Framework**: Angular 20
- **Lenguaje**: TypeScript
- **Estilos**: CSS
- **Dependencias Principales**:
  - RxJS para manejo de observables
  - SweetAlert2 para notificaciones
  - UUID para generación de identificadores únicos
  - Supabase para almacenamiento de imágenes

### Backend
- **Framework**: NestJS
- **Lenguaje**: TypeScript
- **Base de Datos**: PostgreSQL
- **ORM**: TypeORM
- **Autenticación**: JWT
- **Dependencias Principales**:
  - bcrypt para hashing de contraseñas
  - class-validator para validación de datos

## Instalación y Configuración

### Prerrequisitos
- Node.js (versión 18 o superior)
- npm o yarn
- PostgreSQL (para la base de datos)
- Una cuenta en Supabase (para almacenamiento de imágenes)

### Backend (API)

1. Navega al directorio del backend:
   ```bash
   cd cocina-compartida-api
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   - Copia el archivo `.template.env` a `.env`:
     ```bash
     cp .template.env .env
     ```
   - Edita `.env` con tus configuraciones:
     - `DB_HOST`: Host de PostgreSQL (ej. localhost)
     - `DB_PORT`: Puerto de PostgreSQL (ej. 5432)
     - `DB_USER`: Usuario de PostgreSQL
     - `DB_PASSWORD`: Contraseña de PostgreSQL
     - `DB_NAME`: Nombre de la base de datos
     - `JWT_SECRET`: Clave secreta para JWT
     - `PORT`: Puerto del servidor (por defecto 3000)

4. Inicia el servidor de desarrollo:
   ```bash
   npm run start:dev
   ```

   El backend estará disponible en `http://localhost:3000`.

### Frontend

1. Navega al directorio del frontend:
   ```bash
   cd cocina-compartida
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Inicia el servidor de desarrollo:
   ```bash
   npm start
   ```

   La aplicación estará disponible en `http://localhost:4200`.

## Uso

- Asegúrate de que tanto el backend como el frontend estén ejecutándose.
- Navega a la página de inicio para ver recetas destacadas.
- Regístrate o inicia sesión para acceder a funciones completas.
- Explora recetas existentes o sube tus propias creaciones.
- Gestiona tu perfil y visualiza tus recetas publicadas.

