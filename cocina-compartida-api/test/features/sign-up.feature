# ============================================================
# Funcionalidad: Registro de Cuenta (Sign Up)
# Endpoint: POST /users
# Requisito: El correo y nombre de usuario deben ser únicos.
# ============================================================
Feature: Registro de Cuenta
  Como visitante de Cocina Compartida
  Quiero poder crear una cuenta nueva con mi nombre, correo y contraseña
  Para poder compartir mis recetas y acceder a funcionalidades exclusivas

  # ─── Escenario Exitoso ────────────────────────────────────────────────────
  Scenario: Registro exitoso con datos válidos
    Given que no existe ningún usuario con el correo "nuevo_chef@test.com"
    And no existe ningún usuario con el nombre "NuevoChef"
    When envía una solicitud POST a "/users" con los siguientes datos:
      | campo     | valor                 |
      | username  | "NuevoChef"           |
      | email     | "nuevo_chef@test.com" |
      | password  | "Password123!"        |
    Then debe recibir una respuesta con código HTTP 201
    And el cuerpo de la respuesta debe contener el campo "id"
    And el cuerpo de la respuesta debe contener el campo "username" con el valor "NuevoChef"
    And el cuerpo de la respuesta debe contener el campo "email" con el valor "nuevo_chef@test.com"
    And el cuerpo de la respuesta NO debe contener el campo "password"

  # ─── Escenarios Negativos ────────────────────────────────────────────────
  Scenario: Registro fallido con correo ya existente
    Given que ya existe un usuario con el correo "chef_existente@test.com"
    When un nuevo visitante intenta registrarse con ese mismo correo
    Then debe recibir una respuesta con código HTTP 409
    And el mensaje de error debe indicar que el correo ya está en uso
  Scenario: Registro fallido con nombre de usuario ya existente
    Given que ya existe un usuario con el nombre "ChefRepetido"
    When un nuevo visitante intenta registrarse con ese mismo nombre de usuario
    Then debe recibir una respuesta con código HTTP 409
    And el mensaje de error debe indicar que el nombre de usuario ya está en uso
  Scenario: Registro fallido al omitir el campo username
    When un visitante envía una solicitud POST a "/users" sin el campo "username"
    Then debe recibir una respuesta con código HTTP 400
  Scenario: Registro fallido al omitir el campo email
    When un visitante envía una solicitud POST a "/users" sin el campo "email"
    Then debe recibir una respuesta con código HTTP 400
  Scenario: Registro fallido al omitir el campo password
    When un visitante envía una solicitud POST a "/users" sin el campo "password"
    Then debe recibir una respuesta con código HTTP 400
  Scenario: Registro fallido con contraseña débil
    When un visitante intenta registrarse con la contraseña "1234"
    Then debe recibir una respuesta con código HTTP 400
    And el mensaje de error debe indicar que la contraseña no cumple los requisitos de seguridad

  # ─── Tabla de Ejemplos ───────────────────────────────────────────────────
  Scenario Outline: Registro con campos obligatorios faltantes
    Given que se intenta registrar un usuario enviando "<campo_omitido>" vacío
    When envía la solicitud POST a "/users"
    Then debe recibir una respuesta con código HTTP 400
    Examples:
      | campo_omitido |
      | username      |
      | email         |
      | password      |
