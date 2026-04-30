# language: es
Característica: Eliminar comentario - Contrato API Backend
  Como sistema NestJS con patrón Screenplay
  Quiero verificar que el controlador delega correctamente la eliminación
  Para garantizar el contrato HTTP de eliminación de comentarios

  Escenario: Solicitud válida delega la eliminación al servicio
    Dado que el actor "Ana" está autenticado con id "u1"
    Cuando Ana intenta eliminar el comentario con id "c1"
    Entonces el servicio debe haber recibido el id "c1" y el usuario autenticado
    Y el resultado debe ser vacío

  Escenario: El servicio lanza una excepción que se propaga al caller
    Dado que el actor "Ana" está autenticado con id "u1"
    Y el servicio lanzará una excepción ForbiddenException
    Cuando Ana intenta eliminar el comentario con id "c1"
    Entonces la excepción debe propagarse al caller
