# language: es
Característica: Editar perfil - Seguridad Backend
  Como sistema de seguridad NestJS
  Quiero verificar que el AuthGuard protege correctamente el endpoint de edición
  Para que solo usuarios con token válido puedan editar su perfil

  Escenario: Solicitud sin header Authorization es rechazada
    Dado que no hay header Authorization en la solicitud
    Cuando el guard evalúa la solicitud de editar perfil
    Entonces debe lanzar UnauthorizedException

  Escenario: Token inválido en el header Authorization es rechazado
    Dado que el header Authorization contiene "Bearer invalid"
    Y el servicio JWT lanzará un error al verificar el token
    Cuando el guard evalúa la solicitud de editar perfil
    Entonces debe lanzar UnauthorizedException

  Escenario: Token expirado en el header Authorization es rechazado
    Dado que el header Authorization contiene "Bearer expired"
    Y el servicio JWT lanzará el error "jwt expired"
    Cuando el guard evalúa la solicitud de editar perfil
    Entonces debe lanzar UnauthorizedException

  Escenario: Token sin campo id/sub en el payload es rechazado
    Dado que el header Authorization contiene "Bearer token"
    Y el servicio JWT retorna un payload sin campo sub
    Cuando el guard evalúa la solicitud de editar perfil
    Entonces debe lanzar UnauthorizedException

  Escenario: Token válido con payload completo permite el acceso
    Dado que el header Authorization contiene "Bearer token"
    Y el servicio JWT retorna un payload válido con sub, username, email y url
    Cuando el guard evalúa la solicitud de editar perfil
    Entonces el guard debe retornar true
