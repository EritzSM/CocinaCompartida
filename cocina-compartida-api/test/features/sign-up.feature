# language: es
# ============================================================
# Funcionalidad: Registro de Cuenta (Sign Up)
# Endpoint: POST /users
# Requisito: El correo y nombre de usuario deben ser únicos.
# ============================================================

Funcionalidad: Registro de Cuenta
  Como visitante de Cocina Compartida
  Quiero poder crear una cuenta nueva con mi nombre, correo y contraseña
  Para poder compartir mis recetas y acceder a funcionalidades exclusivas

  # ─── Escenario Exitoso ────────────────────────────────────────────────────

  Escenario: Registro exitoso con datos válidos
    Dado que no existe ningún usuario con el correo "nuevo_chef@test.com"
    Y no existe ningún usuario con el nombre "NuevoChef"
    Cuando envía una solicitud POST a "/users" con los siguientes datos:
      | campo     | valor                 |
      | username  | "NuevoChef"           |
      | email     | "nuevo_chef@test.com" |
      | password  | "Password123!"        |
    Entonces debe recibir una respuesta con código HTTP 201
    Y el cuerpo de la respuesta debe contener el campo "id"
    Y el cuerpo de la respuesta debe contener el campo "username" con el valor "NuevoChef"
    Y el cuerpo de la respuesta debe contener el campo "email" con el valor "nuevo_chef@test.com"
    Y el cuerpo de la respuesta NO debe contener el campo "password"

  # ─── Escenarios Negativos ────────────────────────────────────────────────

  Escenario: Registro fallido con correo ya existente
    Dado que ya existe un usuario con el correo "chef_existente@test.com"
    Cuando un nuevo visitante intenta registrarse con ese mismo correo
    Entonces debe recibir una respuesta con código HTTP 409
    Y el mensaje de error debe indicar que el correo ya está en uso

  Escenario: Registro fallido con nombre de usuario ya existente
    Dado que ya existe un usuario con el nombre "ChefRepetido"
    Cuando un nuevo visitante intenta registrarse con ese mismo nombre de usuario
    Entonces debe recibir una respuesta con código HTTP 409
    Y el mensaje de error debe indicar que el nombre de usuario ya está en uso

  Escenario: Registro fallido al omitir el campo username
    Cuando un visitante envía una solicitud POST a "/users" sin el campo "username"
    Entonces debe recibir una respuesta con código HTTP 400

  Escenario: Registro fallido al omitir el campo email
    Cuando un visitante envía una solicitud POST a "/users" sin el campo "email"
    Entonces debe recibir una respuesta con código HTTP 400

  Escenario: Registro fallido al omitir el campo password
    Cuando un visitante envía una solicitud POST a "/users" sin el campo "password"
    Entonces debe recibir una respuesta con código HTTP 400

  Escenario: Registro fallido con contraseña débil
    Cuando un visitante intenta registrarse con la contraseña "1234"
    Entonces debe recibir una respuesta con código HTTP 400
    Y el mensaje de error debe indicar que la contraseña no cumple los requisitos de seguridad

  # ─── Tabla de Ejemplos ───────────────────────────────────────────────────

  Esquema del escenario: Registro con campos obligatorios faltantes
    Dado que se intenta registrar un usuario enviando "<campo_omitido>" vacío
    Cuando envía la solicitud POST a "/users"
    Entonces debe recibir una respuesta con código HTTP 400

    Ejemplos:
      | campo_omitido |
      | username      |
      | email         |
      | password      |
