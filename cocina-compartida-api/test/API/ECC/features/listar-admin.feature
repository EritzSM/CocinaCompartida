# language: es
Característica: Listar usuarios - Contrato API Backend (Admin)
  Como administrador del sistema con patrón Screenplay
  Quiero verificar que el controlador delega correctamente al servicio
  Para garantizar el contrato HTTP de listado de usuarios

  Escenario: El controlador delega la consulta al servicio findAll
    Dado que existe al menos un usuario con id "u1" y username "admin"
    Cuando el administrador solicita la lista de usuarios
    Entonces el controlador debe haber delegado a findAll
    Y el resultado debe contener la lista de usuarios
