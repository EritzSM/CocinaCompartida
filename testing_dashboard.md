# 🧪 Dashboard de Ejecución de Pruebas

¡Aquí tienes tu guía rápida para ejecutar todos los frameworks de testing de tu proyecto! Asegúrate de abrir una terminal (PowerShell) y navegar a las carpetas indicadas antes de correr los comandos.

---

## 1. Pruebas de Cypress (E2E Tradicional)
Cypress se encarga de probar la interfaz web de Angular simulando las interacciones del usuario en el navegador.

> [!IMPORTANT]
> **Ubicación del Directorio:**
> `cd C:\Users\User\Documents\Programacion\Desarrollo_web\CocinaCompartida\cocina-compartida`

**Comandos:**
```powershell
# Opción A: Abrir la interfaz gráfica de Cypress (Recomendado para ver qué pasa)
npm run cypress:open

# Opción B: Ejecutar todas las pruebas en modo oculto (Headless)
npm run cypress:run
```

---

## 2. Pruebas Visuales con Applitools
Applitools está integrado directamente dentro de tus pruebas de Cypress. Se encarga de tomar capturas de pantalla de la interfaz y compararlas con Inteligencia Artificial para detectar píxeles fuera de lugar.

> [!IMPORTANT]
> **Ubicación del Directorio:**
> `cd C:\Users\User\Documents\Programacion\Desarrollo_web\CocinaCompartida\cocina-compartida`

**Comando:**
Para ejecutar Applitools, debes establecer tu clave de API como variable de entorno y luego ejecutar Cypress:
```powershell
# 1. Configura tu API Key (Reemplaza con tu llave real)
$env:APPLITOOLS_API_KEY="TU_CLAVE_DE_APPLITOOLS"

# 2. Ejecuta Cypress
npm run cypress:run
```

---

## 3. Pruebas de Backend con Keploy
Keploy graba y reproduce el tráfico de red de tu API para probar el backend sin necesidad de escribir código adicional. 

> [!IMPORTANT]
> **Ubicación del Directorio:** (La raíz de tu proyecto)
> `cd C:\Users\User\Documents\Programacion\Desarrollo_web\CocinaCompartida`

**Comando:**
*Nota: Keploy suele requerir que le pases el comando con el que inicias tu servidor backend.*
```powershell
# Iniciar la repetición de los test grabados
keploy test -c "npm start" 
# (Cambia "npm start" por el comando que levanta tu API de node/java)
```

---

## 4. Pruebas E2E Inteligentes con Stagehand
Stagehand utiliza Inteligencia Artificial para navegar por la web, observar la estructura DOM y extraer datos (ej. probar el Login).

> [!IMPORTANT]
> **Ubicación del Directorio:**
> `cd C:\Users\User\Documents\Programacion\Desarrollo_web\CocinaCompartida\stagehand-tests`

**Comandos:**
```powershell
# Ejecutar TODO el suite de pruebas (Login, Recetas, etc)
npm run test

# Ejecutar SÓLO la prueba de Login
npm run test:auth
```

---

## 5. Pruebas de Alineación (LLM Evaluator) con DeepEval
DeepEval califica las respuestas extraídas por Stagehand usando métricas matemáticas y LLMs (Toxicidad, Exactitud y RAG).

> [!TIP]
> Dado que está configurado para correr usando **Ollama de forma local** para no agotar tu límite de API de la nube, **asegúrate de que Ollama esté encendido** (`ollama serve`) antes de correr este test.

> [!IMPORTANT]
> **Ubicación del Directorio:**
> `cd C:\Users\User\Documents\Programacion\Desarrollo_web\CocinaCompartida\stagehand-tests`

**Comando:**
```powershell
# Esto ejecutará primero Stagehand para extraer datos y luego correrá la evaluación de DeepEval en Python:
npm run test:eval
```
