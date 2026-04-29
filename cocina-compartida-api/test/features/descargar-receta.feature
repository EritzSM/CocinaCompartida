# language: es
# ============================================================
# Funcionalidad: Descargar Receta
# Endpoint: GET /recipes/:id/download?format=pdf|image
# Seguridad: Requiere JWT válido (AuthGuard)
# Formatos disponibles:
#   - pdf   → genera un PDF con nombre, descripción, ingredientes y pasos
#   - image → redirige (302) a la URL de la primera imagen de la receta
# ============================================================

Funcionalidad: Descargar Receta
  Como usuario autenticado en Cocina Compartida
  Quiero poder descargar una receta en formato PDF o como imagen
  Para guardarla en mi dispositivo y consultarla sin conexión a internet

  Antecedentes:
    Dado que existe una receta con id "receta-abc-123" que tiene nombre, descripción,
    ingredientes y pasos definidos
    Y que el usuario "Ana" está registrado y tiene un JWT válido

  # ─── Escenarios: DESCARGA EN PDF ─────────────────────────────────────────

  Escenario: Descargar receta como PDF (formato por defecto)
    Dado que el usuario "Ana" tiene un JWT válido
    Cuando envía una solicitud GET a "/recipes/receta-abc-123/download"
    Y el encabezado "Authorization" contiene "Bearer <jwt_valido>"
    Entonces debe recibir una respuesta con código HTTP 200
    Y el encabezado "Content-Type" de la respuesta debe ser "application/pdf"
    Y el encabezado "Content-Disposition" debe indicar un archivo adjunto con extensión ".pdf"
    Y el cuerpo de la respuesta debe ser un stream de datos binarios no vacío

  Escenario: Descargar receta como PDF especificando el parámetro de formato
    Dado que el usuario "Ana" tiene un JWT válido
    Cuando envía una solicitud GET a "/recipes/receta-abc-123/download?format=pdf"
    Y el encabezado "Authorization" contiene "Bearer <jwt_valido>"
    Entonces debe recibir una respuesta con código HTTP 200
    Y el encabezado "Content-Type" debe ser "application/pdf"

  # ─── Escenarios: DESCARGA DE IMAGEN ──────────────────────────────────────

  Escenario: Descargar imagen de receta que tiene imágenes disponibles
    Dado que la receta "receta-abc-123" tiene al menos una imagen con URL "https://ejemplo.com/imagen.jpg"
    Y el usuario "Ana" tiene un JWT válido
    Cuando envía una solicitud GET a "/recipes/receta-abc-123/download?format=image"
    Y el encabezado "Authorization" contiene "Bearer <jwt_valido>"
    Entonces debe recibir una respuesta con código HTTP 302
    Y el encabezado "Location" debe redirigir a "https://ejemplo.com/imagen.jpg"

  Escenario: Solicitar imagen de receta que no tiene imágenes descarga PDF de fallback
    Dado que la receta "receta-abc-123" NO tiene imágenes definidas
    Y el usuario "Ana" tiene un JWT válido
    Cuando envía una solicitud GET a "/recipes/receta-abc-123/download?format=image"
    Y el encabezado "Authorization" contiene "Bearer <jwt_valido>"
    Entonces debe recibir una respuesta con código HTTP 200
    Y el encabezado "Content-Type" debe ser "application/pdf"

  # ─── Escenarios Negativos ────────────────────────────────────────────────

  Escenario: Descargar receta sin JWT es rechazado
    Dado que el visitante NO está autenticado
    Cuando envía una solicitud GET a "/recipes/receta-abc-123/download" sin encabezado "Authorization"
    Entonces debe recibir una respuesta con código HTTP 401
    Y el cuerpo de la respuesta debe contener el mensaje "Falta Authorization"

  Escenario: Descargar receta con JWT inválido es rechazado
    Cuando el usuario envía una solicitud GET a "/recipes/receta-abc-123/download" con un token malformado
    Entonces debe recibir una respuesta con código HTTP 401
    Y el mensaje de error debe indicar "Token inválido o expirado"

  Escenario: Descargar una receta que no existe devuelve error
    Dado que el usuario "Ana" tiene un JWT válido
    Cuando envía una solicitud GET a "/recipes/id-que-no-existe/download"
    Y el encabezado "Authorization" contiene "Bearer <jwt_valido>"
    Entonces debe recibir una respuesta con código HTTP 404

  # ─── Tabla de Ejemplos ───────────────────────────────────────────────────

  Esquema del escenario: Descargar con distintos formatos válidos
    Dado que el usuario "Ana" tiene un JWT válido
    Y que la receta "receta-abc-123" existe y tiene imágenes
    Cuando envía GET a "/recipes/receta-abc-123/download?format=<formato>"
    Entonces debe recibir una respuesta con código HTTP <codigo>

    Ejemplos:
      | formato | codigo |
      | pdf     | 200    |
      | image   | 302    |
