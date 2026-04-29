# ============================================================
# Feature: Like / Unlike en una Receta
# Endpoint: POST /recipes/:id/like  (toggle — un único endpoint)
# Seguridad: Requiere JWT válido (AuthGuard)
# Comportamiento: Si el usuario NO ha dado like → agrega like
#                 Si el usuario YA dio like → retira el like
# ============================================================

Feature: Like y Unlike en una Receta
  Como usuario autenticado en Cocina Compartida
  Quiero poder dar o quitar "like" a una receta con un solo botón
  Para expresar si me gustó la receta y ayudar a clasificar las más populares

  Background:
    Given que existe una receta con id "receta-abc-123" publicada por "Chef Carlos"
    And que el usuario "Ana" está registrado y tiene un JWT válido

  # ─── Escenarios: DAR LIKE ─────────────────────────────────────────────────

  Scenario: Usuario da like a una receta por primera vez
    Given que el usuario "Ana" NO ha dado like a la receta "receta-abc-123"
    When envía una solicitud POST a "/recipes/receta-abc-123/like"
    And el encabezado "Authorization" contiene "Bearer <jwt_valido>"
    Then debe recibir una respuesta con código HTTP 201
    And el cuerpo de la respuesta debe indicar que el like fue agregado
    And el contador de likes de la receta debe haber incrementado en 1

  # ─── Escenarios: QUITAR LIKE (UNLIKE) ────────────────────────────────────

  Scenario: Usuario quita el like de una receta que ya había dado like
    Given que el usuario "Ana" YA dio like a la receta "receta-abc-123"
    When envía una solicitud POST a "/recipes/receta-abc-123/like"
    And el encabezado "Authorization" contiene "Bearer <jwt_valido>"
    Then debe recibir una respuesta con código HTTP 201
    And el cuerpo de la respuesta debe indicar que el like fue eliminado
    And el contador de likes de la receta debe haber decrementado en 1

  # ─── Escenarios: COMPORTAMIENTO TOGGLE ───────────────────────────────────

  Scenario: Dar y quitar like de forma alternada resulta en el estado original
    Given que el usuario "Ana" NO ha dado like a la receta "receta-abc-123"
    When da like a la receta (primer POST)
    And luego quita el like a la receta (segundo POST)
    Then el contador de likes debe estar en el mismo valor que al inicio

  # ─── Escenarios Negativos ────────────────────────────────────────────────

  Scenario: Like sin JWT es rechazado
    Given que el visitante NO está autenticado
    When envía una solicitud POST a "/recipes/receta-abc-123/like" sin encabezado "Authorization"
    Then debe recibir una respuesta con código HTTP 401
    And el cuerpo de la respuesta debe contener el mensaje "Falta Authorization"

  Scenario: Like con JWT inválido es rechazado
    When envía una solicitud POST a "/recipes/receta-abc-123/like" con un token malformado
    Then debe recibir una respuesta con código HTTP 401
    And el mensaje de error debe indicar "Token inválido o expirado"

  Scenario: Like a una receta inexistente devuelve error
    Given que el usuario "Ana" tiene un JWT válido
    When envía una solicitud POST a "/recipes/id-que-no-existe/like"
    And el encabezado "Authorization" contiene "Bearer <jwt_valido>"
    Then debe recibir una respuesta con código HTTP 404

  # ─── Tabla de Ejemplos ───────────────────────────────────────────────────

  Scenario Outline: Toggle de like con distintos usuarios
    Given que el usuario "<usuario>" tiene un JWT válido
    And que la receta "receta-abc-123" existe
    When "<usuario>" envía POST a "/recipes/receta-abc-123/like" por primera vez
    Then el estado del like para "<usuario>" debe ser "activo"
    And cuando "<usuario>" envía POST a "/recipes/receta-abc-123/like" por segunda vez
    Then el estado del like para "<usuario>" debe ser "inactivo"

    Examples:
      | usuario  |
      | Ana      |
      | Roberto  |
      | Luisa    |
