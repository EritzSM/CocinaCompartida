# language: es
Característica: Editar perfil de usuario - Contrato API Backend
  Como sistema NestJS con patrón Screenplay
  Quiero verificar que el controlador delega correctamente al servicio
  Para garantizar el contrato HTTP de edición de perfil

  Escenario: DTO válido delega el update con el id autenticado
    Dado que el actor "Ana" está autenticado con id "u1"
    Y prepara un dto con username "nuevoNombre"
    Cuando Ana intenta editar su perfil
    Entonces el servicio debe haber recibido el id "u1" y el dto
    Y el resultado debe corresponder al usuario actualizado

  Escenario: La respuesta del servicio no expone el campo password
    Dado que el actor "Ana" está autenticado con id "u1"
    Y prepara un dto con bio "bio nueva"
    Cuando Ana intenta editar su perfil
    Entonces el resultado no debe contener el campo "password"
