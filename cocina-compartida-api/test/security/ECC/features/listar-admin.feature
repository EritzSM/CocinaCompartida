# language: es
Característica: Listar usuarios admin - Seguridad Backend
  Como sistema de seguridad NestJS
  Quiero verificar que el RoleGuard protege correctamente el acceso administrativo
  Para que solo usuarios con permisos correctos puedan listar todos los usuarios

  Escenario: Solicitud sin header Authorization es rechazada con ForbiddenException
    Dado que no hay header Authorization en la solicitud
    Cuando el RoleGuard evalúa la solicitud de listar usuarios
    Entonces debe lanzar ForbiddenException

  Escenario: El id del token no coincide con el userId del body y se lanza ForbiddenException
    Dado que el header Authorization contiene "Bearer token" con id "u1"
    Y el body de la solicitud contiene userId "u2"
    Cuando el RoleGuard evalúa la solicitud de listar usuarios
    Entonces debe lanzar ForbiddenException
