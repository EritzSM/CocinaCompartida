# language: es
# ============================================================
# Funcionalidad: Inicio de Sesión (Login)
# Endpoint: POST /auth/login
# Requisito: El usuario debe estar previamente registrado.
# ============================================================

Funcionalidad: Inicio de Sesión
  Como usuario registrado en Cocina Compartida
  Quiero poder iniciar sesión con mi correo y contraseña
  Para acceder a las funcionalidades protegidas de la plataforma

  Antecedentes:
    Dado que existe un usuario registrado con el correo "chef@test.com" y contraseña "Password123!"

  # ─── Escenario Exitoso ────────────────────────────────────────────────────

  Escenario: Login exitoso con credenciales válidas
    Dado que el usuario tiene el correo "chef@test.com"
    Y tiene la contraseña "Password123!"
    Cuando envía una solicitud POST a "/auth/login" con esas credenciales
    Entonces debe recibir una respuesta con código HTTP 201
    Y el cuerpo de la respuesta debe contener un campo "token"
    Y el valor del campo "token" debe ser una cadena de texto no vacía

  # ─── Escenarios Negativos ────────────────────────────────────────────────

  Escenario: Login fallido con contraseña incorrecta
    Dado que el usuario tiene el correo "chef@test.com"
    Y tiene la contraseña "ContraseñaIncorrecta"
    Cuando envía una solicitud POST a "/auth/login" con esas credenciales
    Entonces debe recibir una respuesta con código HTTP 401
    Y el cuerpo de la respuesta debe contener un mensaje de error

  Escenario: Login fallido con correo no registrado
    Dado que no existe ningún usuario con el correo "fantasma@test.com"
    Cuando envía una solicitud POST a "/auth/login" con ese correo y cualquier contraseña
    Entonces debe recibir una respuesta con código HTTP 401

  Escenario: Login fallido al omitir el campo contraseña
    Dado que el usuario sólo envía el correo "chef@test.com" sin contraseña
    Cuando envía una solicitud POST a "/auth/login"
    Entonces debe recibir una respuesta con código HTTP 400
    Y el mensaje de error debe indicar que el campo "password" es obligatorio

  Escenario: Login fallido al omitir el campo correo
    Dado que el usuario sólo envía la contraseña "Password123!" sin correo
    Cuando envía una solicitud POST a "/auth/login"
    Entonces debe recibir una respuesta con código HTTP 400
    Y el mensaje de error debe indicar que el campo "email" es obligatorio

  # ─── Tabla de Ejemplos ───────────────────────────────────────────────────

  Esquema del escenario: Login con múltiples combinaciones inválidas
    Dado que se intenta iniciar sesión con correo "<correo>" y contraseña "<contraseña>"
    Cuando envía una solicitud POST a "/auth/login"
    Entonces debe recibir una respuesta con código HTTP <codigo>

    Ejemplos:
      | correo              | contraseña        | codigo |
      | ""                  | "Password123!"    | 400    |
      | "chef@test.com"     | ""                | 400    |
      | ""                  | ""                | 400    |
      | "no-es-un-email"    | "Password123!"    | 400    |
