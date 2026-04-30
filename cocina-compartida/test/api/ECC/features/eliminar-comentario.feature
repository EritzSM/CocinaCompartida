# language: es
Característica: Eliminar comentario - Contrato API Frontend
  Como usuario del frontend Angular con patrón Screenplay
  Quiero verificar que el servicio envíe la solicitud HTTP correcta para eliminar comentarios
  Para garantizar el contrato con la API de eliminación de comentarios

  Escenario: deleteComment envía DELETE al endpoint correcto con header Authorization
    Dado que el actor "fan" tiene el token "token" en localStorage
    Y existe la receta "r1" con el comentario "c1"
    Cuando fan elimina el comentario "c1"
    Entonces la solicitud debe ser DELETE a /api/recipes/comments/c1
    Y la solicitud debe incluir el header "Authorization: Bearer token"
