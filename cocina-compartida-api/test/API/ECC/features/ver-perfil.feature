# language: es
Característica: Ver perfil de usuario - Contrato API Backend
  Como sistema NestJS con patrón Screenplay
  Quiero verificar que el controlador devuelve el perfil correctamente
  Para garantizar el contrato HTTP de visualización de perfil

  Escenario: El usuario existe y el controlador retorna su perfil completo
    Dado que existe un usuario con id "1" y username "testuser"
    Cuando se solicita el perfil del usuario con id "1"
    Entonces el controlador debe haber delegado a findOne con id "1"
    Y el resultado debe contener el perfil del usuario

  Escenario: El perfil retornado incluye los campos esperados y omite password
    Dado que existe un usuario con id "1" y campos id, username, email, avatar y bio
    Cuando se solicita el perfil del usuario con id "1"
    Entonces el resultado debe contener los campos id, username, email, avatar y bio
    Y el resultado no debe contener el campo "password"

  Escenario: El usuario no existe y se lanza NotFoundException
    Dado que no existe ningún usuario con id "missing"
    Cuando se solicita el perfil del usuario con id "missing"
    Entonces la excepción NotFoundException debe propagarse al caller
