# language: es
Característica: Editar perfil de usuario - Pruebas de Regresión Backend
  Como desarrollador que verifica la integridad del servicio
  Quiero asegurar que los flujos de edición de perfil no se rompan
  Para proteger el comportamiento existente ante nuevos cambios

  Escenario: DTO vacío provoca BadRequestException
    Dado que el usuario "u1" existe en el sistema
    Y se envía un dto vacío
    Cuando se intenta actualizar el perfil de "u1"
    Entonces el servicio debe lanzar BadRequestException
    Y el repositorio debe haber sido llamado con update vacío

  Escenario: Email ya existente en otro usuario provoca ConflictException
    Dado que el usuario "u2" tiene el email "dup@test.com"
    Cuando el usuario "u1" intenta actualizar su perfil con email "dup@test.com"
    Entonces el servicio debe lanzar ConflictException
    Y el repositorio no debe haber sido llamado con update

  Escenario: Repositorio no encuentra al usuario después de actualizar y lanza NotFoundException
    Dado que el repositorio retorna null al buscar al usuario "u1"
    Cuando se intenta actualizar el perfil de "u1" con username "nuevo"
    Entonces el servicio debe lanzar NotFoundException
