# 🚀 Guía de Configuración de CI/CD: Jenkins + SonarQube + Docker

Esta guía explica paso a paso todas las configuraciones necesarias para que el pipeline de la aplicación **Cocina Compartida** funcione correctamente con integración continua, pruebas (Karma/Puppeteer) y análisis estático (SonarQube) dentro de contenedores Docker.

---

## 1. Topología y Red de Docker

Para que los contenedores de Jenkins y SonarQube puedan comunicarse internamente sin salir a internet, lo primero fue crear una red dedicada de Docker.

```bash
docker network create jenkins-sonar-net
```

Asegúrate de que tanto el contenedor de SonarQube como el de Jenkins se estén ejecutando unidos a esta red.

---

## 2. Ejecución del Contenedor de Jenkins

Para que Jenkins tenga el poder de ejecutar instrucciones de Docker adentro del *Pipeline* (construir contenedores hijos como Fronted y Backend), necesita permisos elevados y acceso al socket del servidor anfitrión.

El contenedor se debe ejecutar con los siguientes parámetros clave:

```bash
docker run -d \
  -u root \
  --name jenkins \
  -p 8080:8080 -p 50000:50000 \
  --network jenkins-sonar-net \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts
```
> [!IMPORTANT]
> - `-u root` permite a Jenkins ejecutar comandos y modificar configuraciones bloqueadas.
> - `-v /var/run/docker.sock` monta el motor de Docker físico en el virtual; esto se llama *Docker-out-of-Docker (DooD)*.

---

## 3. Preparación Interna del Sistema (Dependencias de Jenkins)

### a) Librerías de Chrome (Puppeteer)
El pipeline ejecuta las pruebas de Angular/Karma en modo `ChromeHeadless`. Como el contenedor oficial de Jenkins no incluye entorno gráfico ni navegadores, Puppeteer descarga Chrome localmente, pero fallará (error `libxss1` o `libglib-2.0.so.0 not found`) si faltan librerías de sistema.

Entra al administrador del contenedor y consíguelas con APT:
```bash
docker exec -u root -it jenkins bash
apt-get update
apt-get install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libgbm1 libasound2 libpangocairo-1.0-0 libxss1 libgtk-3-0
```

### b) Docker Compose y Permisos en Git
Además, debes asegurar la ejecución del cliente `docker-compose` e impartir permisos globales sobre las descargas que hace el plugin de Git adentro de Jenkins:

```bash
# Instalamos la extensión docker-compose
apt-get install -y docker-compose-plugin

# Evitamos un conflicto de "git directory owned by another user" por el usuario root
git config --global --add safe.directory '*'
```

---

## 4. Configuración desde la Interfaz de Jenkins (UI)

### 🧩 Plugins Requeridos
En Jenkins entra a **Panel de Control > Administrar Jenkins > Plugins (Available plugins)** e instala los siguientes:
1. **NodeJS Plugin**: Necesario para leer la instrucción `tools { nodejs 'NodeJS' }` en el pipeline.
2. **SonarQube Scanner**: Para interpretar las mediciones de los `sonar-project.properties`.
3. **Pipeline: Stage View**: Extensiones gráficas recomendadas para poder ver la cuadrícula bonita (las celdas verdes/rojas).

### 🛠️ Configuración de Herramientas (Global Tool Configuration)
En **Administrar Jenkins > Tools (Herramientas)**:
1. **NodeJS**:
   - Añade una nueva instancia.
   - Name: `NodeJS` *(debe coincidir con la variable en tu Jenkinsfile)*.
   - Version: Al menos NodeJS 18.x.
2. **SonarQube Scanner**:
   - Añade una instancia y ponle nombre `SonarScanner`. Marca la casilla de descargar automáticamente.

### 📡 Configuración del Servidor SonarQube
En **Administrar Jenkins > System (Sistema)**, busca la sección `SonarQube Servers`:
1. **Name**: `SonarQube` *(debe ser exacto porque se usa en el método `withSonarQubeEnv`)*.
2. **Server URL**: Usa el alias de la red de docker (`http://sonarqube:9000`) o la IP interna, no uses `localhost` porque eso referenciaría al mismo contenedor de Jenkins.
3. **Server Authentication Token**: 
   - Vas al panel de **SonarQube (localhost:9000)** y en tu perfil > Security creas un *User Token*.
   - Luego vuelves a Jenkins, ingresas a *Credentials*, añades un nuevo **Secret Text** y en "Secret" pegas el token.
   - Seleccionas ese token para autenticar tu servidor Sonar en Jenkins.

---

## 5. Explicación del `Jenkinsfile`

El código del pipeline refleja los pasos estandarizados definidos:
1. **Frontend y Backend Tests**: Utiliza el contenedor de NodeJS en primer plano para instalar y ejecutar `test:cov` sacando toda la cobertura a la carpeta `.coverage` (o `coverage`).
2. **SonarQube Analysis**: Levanta el escáner proporcionándole como parámetros de entrada las llaves respectivas a tu Sonar y mandando a la ruta `sonar.javascript.lcov.reportPaths` el reporte local lcov creado en el paso pasado. Todo protegido por `withSonarQubeEnv`.
3. **Quality Gate**: Ejecuta un "wait" condicional (timeout) revisando por medio del API web de Sonar si pasamos o no los estándares requeridos.
4. **Deploy**: Si todo es verde, un sh `docker compose down` y luego un `up -d --build` para subir las imágenes nuevas a producción basada en tus redes locales.

**Consideración final:** Siempre debes tener los puertos host (ej: 3000 o 80) libres antes de que el Jenkinsfile llegue a la etapa de `Deploy`, caso contrario el daemon escupirá un `bind: Only one usage of each socket address`.
