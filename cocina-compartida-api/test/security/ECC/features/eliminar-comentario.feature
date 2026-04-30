# language: es
Característica: Eliminar comentario - Seguridad Backend
  Como sistema de seguridad NestJS
  Quiero verificar que solo el autor puede eliminar un comentario
  Para proteger la integridad de los comentarios de otros usuarios

  Escenario: Usuario que no es el autor intenta eliminar y recibe ForbiddenException
    Dado que existe el comentario "c1" propiedad del usuario "chef" con id "u1"
    Y el actor "otro" con id "u2" no es el autor del comentario
    Cuando "otro" intenta eliminar el comentario "c1"
    Entonces el servicio debe lanzar ForbiddenException
    Y el comentario no debe haber sido eliminado

  Escenario: Comentario inexistente lanza NotFoundException sin intentar la eliminación
    Dado que no existe ningún comentario con id "missing"
    Cuando el actor "chef" intenta eliminar el comentario "missing"
    Entonces el servicio debe lanzar NotFoundException
    Y el repositorio no debe haber ejecutado softRemove
