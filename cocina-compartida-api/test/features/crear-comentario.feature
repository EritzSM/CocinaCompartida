# ============================================================
# Funcionalidad: Crear Comentario en Receta
# Endpoint: POST /recipes/:id/comments
# Requisito: El usuario debe estar autenticado (JWT válido).
# ============================================================
Feature: Crear Comentario en Receta
  Como usuario autenticado de Cocina Compartida
  Quiero poder comentar en las recetas de otros usuarios
  Para compartir mi opinión y contribuir a la comunidad

  Background:
    Given que existe un usuario "Mateo" registrado con correo "mateo@test.com" y contraseña "Password123!"
    And "Mateo" inicia sesión y obtiene un JWT válido
    And existe una receta publicada por "Mateo" con nombre "Tacos al pastor"

  # ─── Happy Path ──────────────────────────────────────────────────────────
  Scenario: Crear un comentario exitosamente con JWT válido
    Given que "Mateo" tiene un JWT válido
    When "Mateo" envía un comentario con mensaje "¡Excelente receta, me encantó!" en la receta
    Then debe recibir un código HTTP 201
    And el cuerpo de la respuesta debe contener un campo "id"
    And el cuerpo de la respuesta debe contener el campo "message" con valor "¡Excelente receta, me encantó!"
    And el comentario debe aparecer en el listado de comentarios de la receta

  # ─── Edge Cases ──────────────────────────────────────────────────────────
  Scenario: Crear comentario con mensaje muy largo
    Given que "Mateo" tiene un JWT válido
    When "Mateo" envía un comentario con un mensaje de 500 caracteres en la receta
    Then debe recibir un código HTTP 201
    And el campo "message" en la respuesta debe tener 500 caracteres

  Scenario: Intentar crear un comentario en una receta inexistente
    Given que "Mateo" tiene un JWT válido
    When "Mateo" envía un comentario con mensaje "Test" en la receta con id "uuid-inexistente-999"
    Then debe recibir un código HTTP 404

  # ─── Errores de Seguridad ────────────────────────────────────────────────
  Scenario: Crear comentario sin token JWT (Sin autenticación)
    When un visitante sin autenticación envía un comentario con mensaje "Hack attempt" en la receta
    Then debe recibir un código HTTP 401
    And el mensaje de error debe contener "Falta Authorization"

  Scenario: Crear comentario con token JWT falsificado
    When un visitante envía un comentario con token falso "eyJhbGciOiJIUzI1NiJ9.falso.inventado" en la receta
    Then debe recibir un código HTTP 401
    And el mensaje de error debe contener "Token inválido o expirado"

  Scenario: Crear comentario con token JWT expirado
    When un visitante envía un comentario con token expirado en la receta
    Then debe recibir un código HTTP 401

  # ─── Scenario Outline: Mensajes inválidos ────────────────────────────────
  Scenario Outline: Intentar crear comentario con datos inválidos
    Given que "Mateo" tiene un JWT válido
    When "Mateo" envía un comentario con mensaje "<mensaje>" en la receta
    Then debe recibir un código HTTP <codigo>

    Examples:
      | mensaje | codigo |
      |         | 400    |
