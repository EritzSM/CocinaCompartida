# ============================================================
# Funcionalidad: Inicio de Sesión (Login)
# Endpoint: POST /auth/login
# Requisito: El usuario debe estar previamente registrado.
# ============================================================
Feature: Inicio de Sesión
  Como usuario registrado en Cocina Compartida
  Quiero poder iniciar sesión con mi correo y contraseña
  Para acceder a las funcionalidades protegidas de la plataforma
  Background:
    Given que existe un usuario registrado con el correo "chef@test.com" y contraseña "Password123!"

  # ─── Escenario Exitoso ────────────────────────────────────────────────────
  Scenario: Login exitoso con credenciales válidas
    Given que el usuario tiene el correo "chef@test.com"
    And tiene la contraseña "Password123!"
    When envía una solicitud POST a "/auth/login" con esas credenciales
    Then debe recibir una respuesta con código HTTP 201
    And el cuerpo de la respuesta debe contener un campo "token"
    And el valor del campo "token" debe ser una cadena de texto no vacía

  # ─── Escenarios Negativos ────────────────────────────────────────────────
  Scenario: Login fallido con contraseña incorrecta
    Given que el usuario tiene el correo "chef@test.com"
    And tiene la contraseña "ContraseñaIncorrecta"
    When envía una solicitud POST a "/auth/login" con esas credenciales
    Then debe recibir una respuesta con código HTTP 401
    And el cuerpo de la respuesta debe contener un mensaje de error
  Scenario: Login fallido con correo no registrado
    Given que no existe ningún usuario con el correo "fantasma@test.com"
    When envía una solicitud POST a "/auth/login" con ese correo y cualquier contraseña
    Then debe recibir una respuesta con código HTTP 401
  Scenario: Login fallido al omitir el campo contraseña
    Given que el usuario sólo envía el correo "chef@test.com" sin contraseña
    When envía una solicitud POST a "/auth/login"
    Then debe recibir una respuesta con código HTTP 400
    And el mensaje de error debe indicar que el campo "password" es obligatorio
  Scenario: Login fallido al omitir el campo correo
    Given que el usuario sólo envía la contraseña "Password123!" sin correo
    When envía una solicitud POST a "/auth/login"
    Then debe recibir una respuesta con código HTTP 400
    And el mensaje de error debe indicar que el campo "email" es obligatorio

  # ─── Tabla de Ejemplos ───────────────────────────────────────────────────
  Scenario Outline: Login con múltiples combinaciones inválidas
    Given que se intenta iniciar sesión con correo "<correo>" y contraseña "<contraseña>"
    When envía una solicitud POST a "/auth/login"
    Then debe recibir una respuesta con código HTTP <codigo>
    Examples:
      | correo              | contraseña        | codigo |
      | ""                  | "Password123!"    | 400    |
      | "chef@test.com"     | ""                | 400    |
      | ""                  | ""                | 400    |
      | "no-es-un-email"    | "Password123!"    | 400    |
