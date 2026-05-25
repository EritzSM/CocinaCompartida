Configuración local de Ollama (rápido)

1) Instalar Ollama (Windows)
- Sigue las instrucciones oficiales en https://ollama.com/docs/install (descarga el instalador para Windows y ejecútalo).

2) Descargar un modelo local
- Ejemplo: `ollama pull phi3:mini` o `ollama pull llama3.2` (escoge el modelo que prefieras).

3) Iniciar el servicio local
- Ejecuta: `ollama run phi3:mini` o `ollama run llama3.2`
- Si tus comandos Ollama empiezan un servidor HTTP en `http://localhost:11434`, entonces `OLLAMA_URL` debe apuntar a esa URL.

4) Variables de entorno para `stagehand-tests`
- Crea un archivo `.env` dentro de `stagehand-tests` con:

  OLLAMA_MODEL=llama2
  OLLAMA_URL=http://localhost:11434

5) Notas sobre compatibilidad
- El adaptador en `utils/stagehand.utils.ts` pasa `modelClientOptions.baseUrl` a Stagehand.
- Si Stagehand no expone un cliente compatible con Ollama, puede ser necesario un "adapter" adicional que traduzca llamadas a la API de Ollama (`/api/generate`).

6) Ejecutar los tests
- Desde `stagehand-tests`:

  npm install
  npm run test:auth

Si necesitas, puedo añadir un pequeño adaptador HTTP para llamar a Ollama directamente desde Stagehand si tu versión no lo soporta nativamente.