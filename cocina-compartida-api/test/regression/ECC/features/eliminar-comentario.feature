# language: es
Característica: Eliminar comentario - Pruebas de Regresión Backend
  Como desarrollador que verifica la integridad del servicio
  Quiero asegurar que la eliminación de comentarios no se rompa
  Para proteger el comportamiento existente ante nuevos cambios

  Antecedentes:
    Dado que existe el comentario "c1" con mensaje "Buen comentario" del usuario "chef"

  Escenario: El autor del comentario puede eliminarlo exitosamente
    Dado que el actor "chef" con id "u1" es el autor del comentario "c1"
    Cuando chef intenta eliminar el comentario "c1"
    Entonces el repositorio debe haber ejecutado softRemove del comentario

  Escenario: Comentario inexistente provoca NotFoundException
    Dado que no existe ningún comentario con id "missing"
    Cuando el actor "chef" intenta eliminar el comentario "missing"
    Entonces el servicio debe lanzar NotFoundException

  Escenario: Usuario distinto al autor recibe ForbiddenException y el comentario no se elimina
    Dado que el comentario "c1" pertenece al usuario "chef" con id "u1"
    Y el actor "otro" con id "u2" no es el autor
    Cuando "otro" intenta eliminar el comentario "c1"
    Entonces el servicio debe lanzar ForbiddenException
    Y el repositorio no debe haber ejecutado softRemove
