# language: es
Característica: Ver perfil de usuario - Pruebas de Regresión Backend
  Como desarrollador que verifica la integridad del servicio
  Quiero asegurar que la consulta de perfil no exponga datos sensibles
  Para proteger la privacidad de los usuarios

  Escenario: Usuario existente retorna el perfil sin exponer el password
    Dado que existe el usuario con id "1" y password hasheado "hashed"
    Cuando se solicita el perfil del usuario con id "1"
    Entonces el resultado no debe contener el campo "password"

  Escenario: Usuario inexistente provoca NotFoundException
    Dado que no existe ningún usuario con id "missing"
    Cuando se solicita el perfil del usuario con id "missing"
    Entonces el servicio debe lanzar NotFoundException

  Escenario: Fallo del repositorio provoca InternalServerErrorException
    Dado que el repositorio de usuarios lanzará un error de base de datos
    Cuando se solicita el perfil del usuario con id "1"
    Entonces el servicio debe lanzar InternalServerErrorException
