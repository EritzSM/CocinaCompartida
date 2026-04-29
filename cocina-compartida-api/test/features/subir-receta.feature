# ============================================================
# Funcionalidad: Subir Receta
# Endpoint: POST /recipes
# Seguridad: Requiere JWT válido (AuthGuard)
# Campos requeridos: name, descripcion, ingredients[], steps[]
# Campos opcionales: images[], category
# ============================================================
Feature: Subir Receta
  Como cocinero autenticado en Cocina Compartida
  Quiero poder publicar una nueva receta con nombre, descripción, ingredientes y pasos
  Para compartir mis conocimientos culinarios con la comunidad
  Background:
    Given que el cocinero "María" está registrado y tiene un JWT válido
    And el cocinero "María" está autenticado en el sistema

  # ─── Escenarios Exitosos ──────────────────────────────────────────────────
  Scenario: Subir receta exitosamente con campos mínimos requeridos
    When el cocinero envía una solicitud POST a "/recipes" con los siguientes datos:
      | campo       | valor                        |
      | name        | "Sopa de Tomate"             |
      | descripcion | "Sopa casera reconfortante"  |
      | ingredients | ["Tomates", "Cebolla", "Ajo"]|
      | steps       | ["Sofría", "Hierva", "Sirva"]|
    And el encabezado "Authorization" contiene "Bearer <jwt_valido>"
    Then debe recibir una respuesta con código HTTP 201
    And el cuerpo de la respuesta debe contener el campo "id"
    And el cuerpo de la respuesta debe contener el campo "name" con el valor "Sopa de Tomate"
    And el cuerpo de la respuesta debe contener el campo "ingredients" como lista no vacía
    And el cuerpo de la respuesta debe contener el campo "steps" como lista no vacía
  Scenario: Subir receta exitosamente con categoría e imágenes opcionales
    When el cocinero envía una solicitud POST a "/recipes" con los siguientes datos:
      | campo       | valor                               |
      | name        | "Tacos al Pastor"                   |
      | descripcion | "Tacos tradicionales mexicanos"     |
      | ingredients | ["Cerdo", "Piña", "Cilantro"]       |
      | steps       | ["Marinar", "Asar", "Servir"]       |
      | category    | "platos-fuertes"                    |
      | images      | ["https://ejemplo.com/taco.jpg"]    |
    And el encabezado "Authorization" contiene "Bearer <jwt_valido>"
    Then debe recibir una respuesta con código HTTP 201
    And el cuerpo de la respuesta debe contener el campo "category" con el valor "platos-fuertes"

  # ─── Escenarios Negativos ────────────────────────────────────────────────
  Scenario: Subir receta sin JWT es rechazado
    Given que el visitante NO está autenticado
    When envía una solicitud POST a "/recipes" sin el encabezado "Authorization"
    Then debe recibir una respuesta con código HTTP 401
    And el cuerpo de la respuesta debe contener el mensaje "Falta Authorization"
  Scenario: Subir receta con JWT inválido o expirado es rechazado
    When el cocinero envía una solicitud POST a "/recipes" con un token malformado
    Then debe recibir una respuesta con código HTTP 401
    And el mensaje de error debe indicar "Token inválido o expirado"
  Scenario: Subir receta sin el campo name es rechazado
    When el cocinero envía una solicitud POST a "/recipes" omitiendo el campo "name"
    Then debe recibir una respuesta con código HTTP 400
  Scenario: Subir receta sin ingredientes es rechazado
    When el cocinero envía una solicitud POST a "/recipes" con el campo "ingredients" vacío
    Then debe recibir una respuesta con código HTTP 400
  Scenario: Subir receta sin pasos es rechazado
    When el cocinero envía una solicitud POST a "/recipes" con el campo "steps" vacío
    Then debe recibir una respuesta con código HTTP 400

  # ─── Tabla de Ejemplos ───────────────────────────────────────────────────
  Scenario Outline: Subir receta con campos requeridos faltantes
    Given que el cocinero está autenticado con JWT válido
    When envía la solicitud POST a "/recipes" omitiendo el campo "<campo_faltante>"
    Then debe recibir una respuesta con código HTTP 400
    Examples:
      | campo_faltante |
      | name           |
      | descripcion    |
      | ingredients    |
      | steps          |
