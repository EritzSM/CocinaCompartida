# ============================================================
# Funcionalidad: Descargar Receta
# Endpoint: GET /recipes/:id/download?format=pdf|image
# Seguridad: Requiere JWT válido (AuthGuard)
# Formatos disponibles:
#   - pdf   → genera un PDF con nombre, descripción, ingredientes y pasos
#   - image → redirige (302) a la URL de la primera imagen de la receta
# ============================================================
Feature: Descargar Receta
  Como usuario autenticado en Cocina Compartida
  Quiero poder descargar una receta en formato PDF o como imagen
  Para guardarla en mi dispositivo y consultarla sin conexión a internet
  Background:
    Given que existe una receta con id "receta-abc-123" que tiene nombre, descripción, ingredientes y pasos definidos
    And que el usuario "Ana" está registrado y tiene un JWT válido

  # ─── Escenarios: DESCARGA EN PDF ─────────────────────────────────────────
  Scenario: Descargar receta como PDF (formato por defecto)
    Given que el usuario "Ana" tiene un JWT válido
    When envía una solicitud GET a "/recipes/receta-abc-123/download"
    And el encabezado "Authorization" contiene "Bearer <jwt_valido>"
    Then debe recibir una respuesta con código HTTP 200
    And el encabezado "Content-Type" de la respuesta debe ser "application/pdf"
    And el encabezado "Content-Disposition" debe indicar un archivo adjunto con extensión ".pdf"
    And el cuerpo de la respuesta debe ser un stream de datos binarios no vacío
  Scenario: Descargar receta como PDF especificando el parámetro de formato
    Given que el usuario "Ana" tiene un JWT válido
    When envía una solicitud GET a "/recipes/receta-abc-123/download?format=pdf"
    And el encabezado "Authorization" contiene "Bearer <jwt_valido>"
    Then debe recibir una respuesta con código HTTP 200
    And el encabezado "Content-Type" debe ser "application/pdf"

  # ─── Escenarios: DESCARGA DE IMAGEN ──────────────────────────────────────
  Scenario: Descargar imagen de receta que tiene imágenes disponibles
    Given que la receta "receta-abc-123" tiene al menos una imagen con URL "https://ejemplo.com/imagen.jpg"
    And el usuario "Ana" tiene un JWT válido
    When envía una solicitud GET a "/recipes/receta-abc-123/download?format=image"
    And el encabezado "Authorization" contiene "Bearer <jwt_valido>"
    Then debe recibir una respuesta con código HTTP 302
    And el encabezado "Location" debe redirigir a "https://ejemplo.com/imagen.jpg"
  Scenario: Solicitar imagen de receta que no tiene imágenes descarga PDF de fallback
    Given que la receta "receta-abc-123" NO tiene imágenes definidas
    And el usuario "Ana" tiene un JWT válido
    When envía una solicitud GET a "/recipes/receta-abc-123/download?format=image"
    And el encabezado "Authorization" contiene "Bearer <jwt_valido>"
    Then debe recibir una respuesta con código HTTP 200
    And el encabezado "Content-Type" debe ser "application/pdf"

  # ─── Escenarios Negativos ────────────────────────────────────────────────
  Scenario: Descargar receta sin JWT es rechazado
    Given que el visitante NO está autenticado
    When envía una solicitud GET a "/recipes/receta-abc-123/download" sin encabezado "Authorization"
    Then debe recibir una respuesta con código HTTP 401
    And el cuerpo de la respuesta debe contener el mensaje "Falta Authorization"
  Scenario: Descargar receta con JWT inválido es rechazado
    When el usuario envía una solicitud GET a "/recipes/receta-abc-123/download" con un token malformado
    Then debe recibir una respuesta con código HTTP 401
    And el mensaje de error debe indicar "Token inválido o expirado"
  Scenario: Descargar una receta que no existe devuelve error
    Given que el usuario "Ana" tiene un JWT válido
    When envía una solicitud GET a "/recipes/id-que-no-existe/download"
    And el encabezado "Authorization" contiene "Bearer <jwt_valido>"
    Then debe recibir una respuesta con código HTTP 404

  # ─── Tabla de Ejemplos ───────────────────────────────────────────────────
  Scenario Outline: Descargar con distintos formatos válidos
    Given que el usuario "Ana" tiene un JWT válido
    And que la receta "receta-abc-123" existe y tiene imágenes
    When envía GET a "/recipes/receta-abc-123/download?format=<formato>"
    Then debe recibir una respuesta con código HTTP <codigo>
    Examples:
      | formato | codigo |
      | pdf     | 200    |
      | image   | 302    |
