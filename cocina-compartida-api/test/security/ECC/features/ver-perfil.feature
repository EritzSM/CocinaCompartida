# language: es
Característica: Ver perfil - Seguridad Backend
  Como sistema de seguridad NestJS
  Quiero verificar que el AuthGuard protege correctamente el endpoint de perfil
  Para que solo usuarios autenticados válidos puedan acceder a perfiles protegidos

  Escenario: Solicitud sin header Authorization es rechazada
    Dado que no hay header Authorization en la solicitud
    Cuando el guard evalúa la solicitud de ver perfil
    Entonces debe lanzar UnauthorizedException

  Escenario: Formato diferente a Bearer es rechazado
    Dado que el header Authorization contiene "Basic token"
    Cuando el guard evalúa la solicitud de ver perfil
    Entonces debe lanzar UnauthorizedException

  Escenario: Token inválido es rechazado
    Dado que el header Authorization contiene "Bearer invalid"
    Y el servicio JWT lanzará un error al verificar el token
    Cuando el guard evalúa la solicitud de ver perfil
    Entonces debe lanzar UnauthorizedException

  Escenario: Token expirado es rechazado
    Dado que el header Authorization contiene "Bearer expired"
    Y el servicio JWT lanzará el error "jwt expired"
    Cuando el guard evalúa la solicitud de ver perfil
    Entonces debe lanzar UnauthorizedException

  Escenario: Token sin campo id/sub en el payload es rechazado
    Dado que el header Authorization contiene "Bearer token"
    Y el servicio JWT retorna un payload sin campo sub
    Cuando el guard evalúa la solicitud de ver perfil
    Entonces debe lanzar UnauthorizedException

  Escenario: Token válido con payload completo permite el acceso
    Dado que el header Authorization contiene "Bearer token"
    Y el servicio JWT retorna un payload válido con sub, username, email y url
    Cuando el guard evalúa la solicitud de ver perfil
    Entonces el guard debe retornar true
