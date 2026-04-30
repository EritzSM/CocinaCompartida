# language: es
Característica: Eliminar comentario - Regresión Frontend
  Como desarrollador que verifica la integridad del servicio de interacción
  Quiero asegurar que la eliminación de comentarios actualice el estado correctamente
  Para proteger el comportamiento existente ante nuevos cambios

  Antecedentes:
    Dado que existe la receta "r1" con el comentario "c1" de mensaje "Buen comentario"

  Escenario: Comentario existente confirmado se elimina del estado de la receta
    Dado que el actor "fan" confirma la eliminación del comentario "c1"
    Cuando se elimina el comentario "c1"
    Entonces la receta "r1" no debe tener comentarios
    Y el estado de error debe ser null

  Escenario: Id de comentario inexistente setea error y no llama a la API
    Dado que no existe ningún comentario con id "missing"
    Cuando se intenta eliminar el comentario "missing"
    Entonces la API no debe haber recibido ninguna solicitud DELETE
    Y el estado de error debe contener "El comentario no existe"
