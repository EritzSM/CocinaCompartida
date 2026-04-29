# language: es
# ============================================================
# Funcionalidad: Like / Unlike en una Receta
# Endpoint: POST /recipes/:id/like  (toggle — un único endpoint)
# Seguridad: Requiere JWT válido (AuthGuard)
# Comportamiento: Si el usuario NO ha dado like → agrega like
#                 Si el usuario YA dio like → retira el like
# ============================================================

Funcionalidad: Like y Unlike en una Receta
  Como usuario autenticado en Cocina Compartida
  Quiero poder dar o quitar "like" a una receta con un solo botón
  Para expresar si me gustó la receta y ayudar a clasificar las más populares

  Antecedentes:
    Dado que existe una receta con id "receta-abc-123" publicada por "Chef Carlos"
    Y que el usuario "Ana" está registrado y tiene un JWT válido

  # ─── Escenarios: DAR LIKE ─────────────────────────────────────────────────

  Escenario: Usuario da like a una receta por primera vez
    Dado que el usuario "Ana" NO ha dado like a la receta "receta-abc-123"
    Cuando envía una solicitud POST a "/recipes/receta-abc-123/like"
    Y el encabezado "Authorization" contiene "Bearer <jwt_valido>"
    Entonces debe recibir una respuesta con código HTTP 201
    Y el cuerpo de la respuesta debe indicar que el like fue agregado
    Y el contador de likes de la receta debe haber incrementado en 1

  # ─── Escenarios: QUITAR LIKE (UNLIKE) ────────────────────────────────────

  Escenario: Usuario quita el like de una receta que ya había dado like
    Dado que el usuario "Ana" YA dio like a la receta "receta-abc-123"
    Cuando envía una solicitud POST a "/recipes/receta-abc-123/like"
    Y el encabezado "Authorization" contiene "Bearer <jwt_valido>"
    Entonces debe recibir una respuesta con código HTTP 201
    Y el cuerpo de la respuesta debe indicar que el like fue eliminado
    Y el contador de likes de la receta debe haber decrementado en 1

  # ─── Escenarios: COMPORTAMIENTO TOGGLE ───────────────────────────────────

  Escenario: Dar y quitar like de forma alternada resulta en el estado original
    Dado que el usuario "Ana" NO ha dado like a la receta "receta-abc-123"
    Cuando da like a la receta (primer POST)
    Y luego quita el like a la receta (segundo POST)
    Entonces el contador de likes debe estar en el mismo valor que al inicio

  # ─── Escenarios Negativos ────────────────────────────────────────────────

  Escenario: Like sin JWT es rechazado
    Dado que el visitante NO está autenticado
    Cuando envía una solicitud POST a "/recipes/receta-abc-123/like" sin encabezado "Authorization"
    Entonces debe recibir una respuesta con código HTTP 401
    Y el cuerpo de la respuesta debe contener el mensaje "Falta Authorization"

  Escenario: Like con JWT inválido es rechazado
    Cuando envía una solicitud POST a "/recipes/receta-abc-123/like" con un token malformado
    Entonces debe recibir una respuesta con código HTTP 401
    Y el mensaje de error debe indicar "Token inválido o expirado"

  Escenario: Like a una receta inexistente devuelve error
    Dado que el usuario "Ana" tiene un JWT válido
    Cuando envía una solicitud POST a "/recipes/id-que-no-existe/like"
    Y el encabezado "Authorization" contiene "Bearer <jwt_valido>"
    Entonces debe recibir una respuesta con código HTTP 404

  # ─── Tabla de Ejemplos ───────────────────────────────────────────────────

  Esquema del escenario: Toggle de like con distintos usuarios
    Dado que el usuario "<usuario>" tiene un JWT válido
    Y que la receta "receta-abc-123" existe
    Cuando "<usuario>" envía POST a "/recipes/receta-abc-123/like" por primera vez
    Entonces el estado del like para "<usuario>" debe ser "activo"
    Y cuando "<usuario>" envía POST a "/recipes/receta-abc-123/like" por segunda vez
    Entonces el estado del like para "<usuario>" debe ser "inactivo"

    Ejemplos:
      | usuario  |
      | Ana      |
      | Roberto  |
      | Luisa    |
