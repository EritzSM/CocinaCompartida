# language: es
Característica: Ver comentarios de una receta - Pruebas de Regresión Backend
  Como desarrollador que verifica la integridad del servicio
  Quiero asegurar que la consulta de comentarios no se rompa
  Para proteger el comportamiento existente ante nuevos cambios

  Antecedentes:
    Dado que existe la receta "r1" con nombre "Pasta"

  Escenario: Receta con comentarios retorna la lista completa
    Dado que la receta "r1" tiene 2 comentarios "Buenisima" y "Excelente"
    Cuando se solicitan los comentarios de la receta "r1"
    Entonces el resultado debe contener 2 comentarios
    Y el primer comentario debe tener mensaje "Buenisima"

  Escenario: Receta inexistente provoca NotFoundException
    Dado que no existe ninguna receta con id "missing"
    Cuando se solicitan los comentarios de la receta "missing"
    Entonces el servicio debe lanzar NotFoundException

  Escenario: Fallo del repositorio de comentarios provoca InternalServerErrorException
    Dado que la receta "r1" existe
    Y el repositorio de comentarios lanzará un error de base de datos
    Cuando se solicitan los comentarios de la receta "r1"
    Entonces el servicio debe lanzar InternalServerErrorException

  Escenario: Receta sin comentarios retorna lista vacía
    Dado que la receta "r1" no tiene comentarios
    Cuando se solicitan los comentarios de la receta "r1"
    Entonces el resultado debe ser una lista vacía
