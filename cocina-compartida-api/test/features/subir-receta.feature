# language: es
# ============================================================
# Funcionalidad: Subir Receta
# Endpoint: POST /recipes
# Seguridad: Requiere JWT válido (AuthGuard)
# Campos requeridos: name, descripcion, ingredients[], steps[]
# Campos opcionales: images[], category
# ============================================================

Funcionalidad: Subir Receta
  Como cocinero autenticado en Cocina Compartida
  Quiero poder publicar una nueva receta con nombre, descripción, ingredientes y pasos
  Para compartir mis conocimientos culinarios con la comunidad

  Antecedentes:
    Dado que el cocinero "María" está registrado y tiene un JWT válido
    Y el cocinero "María" está autenticado en el sistema

  # ─── Escenarios Exitosos ──────────────────────────────────────────────────

  Escenario: Subir receta exitosamente con campos mínimos requeridos
    Cuando el cocinero envía una solicitud POST a "/recipes" con los siguientes datos:
      | campo       | valor                        |
      | name        | "Sopa de Tomate"             |
      | descripcion | "Sopa casera reconfortante"  |
      | ingredients | ["Tomates", "Cebolla", "Ajo"]|
      | steps       | ["Sofría", "Hierva", "Sirva"]|
    Y el encabezado "Authorization" contiene "Bearer <jwt_valido>"
    Entonces debe recibir una respuesta con código HTTP 201
    Y el cuerpo de la respuesta debe contener el campo "id"
    Y el cuerpo de la respuesta debe contener el campo "name" con el valor "Sopa de Tomate"
    Y el cuerpo de la respuesta debe contener el campo "ingredients" como lista no vacía
    Y el cuerpo de la respuesta debe contener el campo "steps" como lista no vacía

  Escenario: Subir receta exitosamente con categoría e imágenes opcionales
    Cuando el cocinero envía una solicitud POST a "/recipes" con los siguientes datos:
      | campo       | valor                               |
      | name        | "Tacos al Pastor"                   |
      | descripcion | "Tacos tradicionales mexicanos"     |
      | ingredients | ["Cerdo", "Piña", "Cilantro"]       |
      | steps       | ["Marinar", "Asar", "Servir"]       |
      | category    | "platos-fuertes"                    |
      | images      | ["https://ejemplo.com/taco.jpg"]    |
    Y el encabezado "Authorization" contiene "Bearer <jwt_valido>"
    Entonces debe recibir una respuesta con código HTTP 201
    Y el cuerpo de la respuesta debe contener el campo "category" con el valor "platos-fuertes"

  # ─── Escenarios Negativos ────────────────────────────────────────────────

  Escenario: Subir receta sin JWT es rechazado
    Dado que el visitante NO está autenticado
    Cuando envía una solicitud POST a "/recipes" sin el encabezado "Authorization"
    Entonces debe recibir una respuesta con código HTTP 401
    Y el cuerpo de la respuesta debe contener el mensaje "Falta Authorization"

  Escenario: Subir receta con JWT inválido o expirado es rechazado
    Cuando el cocinero envía una solicitud POST a "/recipes" con un token malformado
    Entonces debe recibir una respuesta con código HTTP 401
    Y el mensaje de error debe indicar "Token inválido o expirado"

  Escenario: Subir receta sin el campo name es rechazado
    Cuando el cocinero envía una solicitud POST a "/recipes" omitiendo el campo "name"
    Entonces debe recibir una respuesta con código HTTP 400

  Escenario: Subir receta sin ingredientes es rechazado
    Cuando el cocinero envía una solicitud POST a "/recipes" con el campo "ingredients" vacío
    Entonces debe recibir una respuesta con código HTTP 400

  Escenario: Subir receta sin pasos es rechazado
    Cuando el cocinero envía una solicitud POST a "/recipes" con el campo "steps" vacío
    Entonces debe recibir una respuesta con código HTTP 400

  # ─── Tabla de Ejemplos ───────────────────────────────────────────────────

  Esquema del escenario: Subir receta con campos requeridos faltantes
    Dado que el cocinero está autenticado con JWT válido
    Cuando envía la solicitud POST a "/recipes" omitiendo el campo "<campo_faltante>"
    Entonces debe recibir una respuesta con código HTTP 400

    Ejemplos:
      | campo_faltante |
      | name           |
      | descripcion    |
      | ingredients    |
      | steps          |
