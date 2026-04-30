# ============================================================
# Funcionalidad: Login y Registro (Regresión)
# Endpoints: POST /auth/login, POST /users
# Requisito: Validación completa de tokens y contratos.
# ============================================================
Feature: Login y Registro — Regresión Completa
  Como QA de Cocina Compartida
  Quiero validar que el flujo de autenticación funciona correctamente
  Para garantizar la seguridad y el contrato de los endpoints

  Background:
    Given que existe un usuario registrado "Chef" con correo "chef_reg@test.com" y contraseña "Password123!"

  # ─── Happy Path: Login ───────────────────────────────────────────────────
  Scenario: Login exitoso devuelve JWT válido
    When "Chef" envía una solicitud de login con correo "chef_reg@test.com" y contraseña "Password123!"
    Then debe recibir un código HTTP 201
    And el cuerpo debe contener "success" con valor true
    And el cuerpo debe contener un "token" que sea un JWT válido con 3 segmentos
    And el tiempo de respuesta debe ser menor a 200ms

  # ─── Errores de Seguridad ────────────────────────────────────────────────
  Scenario: Login con correo inexistente devuelve 404
    When un visitante envía login con correo "fantasma@nowhere.com" y contraseña "cualquiera"
    Then debe recibir un código HTTP 404

  Scenario: Login con contraseña incorrecta devuelve 404
    When "Chef" envía una solicitud de login con correo "chef_reg@test.com" y contraseña "IncorrectaXYZ!"
    Then debe recibir un código HTTP 404

  Scenario: Login sin campos obligatorios devuelve 400
    When un visitante envía login con correo "" y contraseña ""
    Then debe recibir un código HTTP 400

  # ─── Scenario Outline: Combinaciones inválidas ───────────────────────────
  Scenario Outline: Login con combinaciones de datos inválidos
    When un visitante envía login con correo "<correo>" y contraseña "<password>"
    Then debe recibir un código HTTP <codigo>

    Examples:
      | correo              | password          | codigo |
      |                     | Password123!      | 400    |
      | chef_reg@test.com   |                   | 400    |
      |                     |                   | 400    |
      | no-es-un-email      | Password123!      | 400    |

  # ─── Happy Path: Registro ───────────────────────────────────────────────
  Scenario: Registro exitoso con datos válidos
    When un visitante se registra con username "NuevoChef", correo "nuevo_chef@test.com" y contraseña "Password123!"
    Then debe recibir un código HTTP 201
    And el cuerpo debe contener "username" con valor "NuevoChef"
    And el cuerpo NO debe contener el campo "password"
