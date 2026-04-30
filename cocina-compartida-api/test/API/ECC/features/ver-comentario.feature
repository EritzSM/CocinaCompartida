# language: es
Característica: Ver comentarios de una receta - Contrato API Backend
  Como sistema NestJS con patrón Screenplay
  Quiero verificar que el controlador devuelve correctamente los comentarios
  Para garantizar el contrato HTTP de visualización de comentarios

  Escenario: El servicio responde y el controlador retorna los comentarios
    Dado que la receta "r1" tiene comentarios "Buenisima" y "Excelente"
    Cuando se solicitan los comentarios de la receta "r1"
    Entonces el controlador debe haber delegado a findCommentsByRecipe
    Y el resultado debe contener los 2 comentarios

  Escenario: El servicio lanza NotFoundException que se propaga al caller
    Dado que la receta "missing" no existe en el sistema
    Cuando se solicitan los comentarios de la receta "missing"
    Entonces la excepción NotFoundException debe propagarse al caller
