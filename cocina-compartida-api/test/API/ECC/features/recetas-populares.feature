# language: es
Característica: Recetas populares - Contrato API Backend
  Como sistema NestJS con patrón Screenplay
  Quiero verificar que el controlador delega la consulta al servicio
  Para garantizar el contrato HTTP de recetas populares

  Escenario: El controlador delega la consulta al servicio findTopLiked
    Dado que existen recetas con likes en el sistema
    Cuando se solicitan las recetas más populares
    Entonces el controlador debe haber delegado a findTopLiked
    Y el resultado debe contener la lista de recetas populares
