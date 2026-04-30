# language: es
Característica: Ver comentarios - Seguridad Backend
  Como sistema de seguridad NestJS
  Quiero verificar que los comentarios solo se consulten para recetas válidas
  Para garantizar la integridad del acceso a datos de comentarios

  Escenario: Comentarios filtrados correctamente por id de receta
    Dado que la receta "r1" existe en el sistema
    Cuando se solicitan los comentarios de la receta "r1"
    Entonces el repositorio debe consultar con filtro where recipe id igual a "r1"
    Y los comentarios deben incluir las relaciones con el usuario ordenadas por createdAt

  Escenario: Receta inexistente bloquea la consulta de comentarios
    Dado que no existe ninguna receta con id "missing"
    Cuando se solicitan los comentarios de la receta "missing"
    Entonces el servicio debe lanzar NotFoundException
    Y el repositorio de comentarios no debe haber sido consultado
