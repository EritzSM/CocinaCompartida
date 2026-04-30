# language: es
Característica: Ver comentarios de una receta - Contrato API Frontend
  Como usuario del frontend Angular con patrón Screenplay
  Quiero verificar que el servicio consulte el endpoint correcto para los comentarios
  Para garantizar el contrato con la API de comentarios de recetas

  Escenario: loadComments consulta el endpoint correcto y retorna los comentarios
    Dado que el endpoint GET /api/recipes/r1/comments retorna 2 comentarios
    Cuando se solicitan los comentarios de la receta "r1"
    Entonces la solicitud debe ser GET a /api/recipes/r1/comments
    Y el resultado debe contener 2 comentarios
    Y el primer comentario debe tener mensaje "Buenisima"

  Escenario: Fallo de la API retorna un array vacío
    Dado que el endpoint GET /api/recipes/r1/comments responderá con error 500
    Cuando se solicitan los comentarios de la receta "r1"
    Entonces el resultado debe ser una lista vacía
