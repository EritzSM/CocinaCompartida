# ============================================================
# Funcionalidad: Recetas Populares (Top Liked)
# Endpoint: GET /recipes/top-liked
# Requisito: Público, devuelve las 3 recetas con más likes.
# ============================================================
Feature: Recetas Populares — Ordenamiento y Rendimiento
  Como visitante de Cocina Compartida
  Quiero ver las recetas más populares ordenadas por likes
  Para descubrir las mejores recetas de la comunidad

  # ─── Happy Path: Contrato API ────────────────────────────────────────────
  Scenario: Consultar recetas populares devuelve un arreglo con status 200
    When un visitante consulta las recetas populares
    Then debe recibir un código HTTP 200
    And la respuesta debe ser un arreglo

  Scenario: Cada receta popular contiene las propiedades mínimas del contrato
    When un visitante consulta las recetas populares
    Then debe recibir un código HTTP 200
    And cada receta debe tener las propiedades "id", "name" y "likes"
    And "name" debe ser de tipo string
    And "likes" debe ser de tipo number

  Scenario: Las recetas populares devuelven como máximo 3 resultados
    When un visitante consulta las recetas populares
    Then la respuesta debe contener como máximo 3 recetas

  # ─── Ordenamiento ────────────────────────────────────────────────────────
  Scenario: Las recetas populares están ordenadas por likes de mayor a menor
    When un visitante consulta las recetas populares
    Then las recetas deben estar ordenadas por likes en orden descendente

  # ─── Rendimiento ─────────────────────────────────────────────────────────
  Scenario: El endpoint de recetas populares responde en menos de 200ms
    When un visitante consulta las recetas populares
    Then el tiempo de respuesta debe ser menor a 200ms

  Scenario: El sistema soporta 10 peticiones concurrentes en menos de 500ms
    When 10 visitantes consultan las recetas populares simultáneamente
    Then todas las respuestas deben tener código HTTP 200
    And el tiempo total debe ser menor a 500ms
