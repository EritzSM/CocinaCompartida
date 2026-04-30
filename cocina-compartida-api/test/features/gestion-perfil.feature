# ============================================================
# Funcionalidad: Gestión de Perfil de Usuario
# Endpoints: PATCH /users, GET /users/:id, DELETE /users/:id
# Requisito: El usuario debe estar autenticado (JWT válido).
# ============================================================
Feature: Gestión del Perfil de Usuario
  Como usuario autenticado de Cocina Compartida
  Quiero poder ver y editar mi perfil
  Para mantener mi información actualizada en la plataforma

  Background:
    Given que existe un usuario "Mateo" registrado con correo "mateo_perfil@test.com" y contraseña "Password123!"
    And "Mateo" inicia sesión y obtiene un JWT válido

  # ─── Happy Path: Actualizar perfil ───────────────────────────────────────
  Scenario: Actualizar username exitosamente
    When "Mateo" actualiza su perfil con username "MateoActualizado"
    Then debe recibir un código HTTP 200
    And el cuerpo debe contener "username" con valor "MateoActualizado"

  Scenario: Actualizar bio del perfil
    When "Mateo" actualiza su perfil con bio "Chef amateur apasionado por la cocina mexicana"
    Then debe recibir un código HTTP 200
    And el cuerpo debe contener "bio" con valor "Chef amateur apasionado por la cocina mexicana"

  # ─── Edge Cases ──────────────────────────────────────────────────────────
  Scenario: Intentar actualizar perfil con username demasiado corto
    When "Mateo" actualiza su perfil con username "ab"
    Then debe recibir un código HTTP 400

  # ─── Seguridad ───────────────────────────────────────────────────────────
  Scenario: Actualizar perfil sin token JWT
    When un visitante sin autenticación intenta actualizar su perfil con username "Hacker"
    Then debe recibir un código HTTP 401

  Scenario: Consultar perfil de otro usuario con token válido
    When "Mateo" consulta el perfil del usuario con id "otro-user-id"
    Then debe recibir un código HTTP 200
    Or debe recibir un código HTTP 404

  # ─── Eliminar Cuenta ─────────────────────────────────────────────────────
  Scenario: Eliminar cuenta propia exitosamente
    Given que existe un usuario "Temporal" registrado con correo "temporal@test.com" y contraseña "Password123!"
    And "Temporal" inicia sesión y obtiene un JWT válido
    When "Temporal" elimina su cuenta
    Then debe recibir un código HTTP 200
    And "Temporal" ya no debe poder iniciar sesión
