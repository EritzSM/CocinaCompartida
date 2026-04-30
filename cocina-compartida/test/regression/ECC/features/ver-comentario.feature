# language: es
Característica: Ver comentarios de una receta - Regresión Frontend
  Como desarrollador que verifica la integridad del componente RecipeDetail
  Quiero asegurar que la carga de comentarios no se rompa ante distintos escenarios
  Para proteger el comportamiento existente ante nuevos cambios

  Escenario: Receta con comentarios carga correctamente sin errores
    Dado que la receta "r1" tiene 2 comentarios "Buenisima" y "Excelente"
    Cuando el componente RecipeDetail se inicializa con id "r1" en la ruta
    Entonces la receta debe cargarse con sus 2 comentarios
    Y el estado de error debe ser null

  Escenario: Receta sin comentarios mantiene la lista de comentarios vacía
    Dado que la receta "r1" no tiene comentarios
    Cuando el componente RecipeDetail se inicializa con id "r1" en la ruta
    Entonces la receta debe cargarse con 0 comentarios
    Y el estado de error debe ser null

  Escenario: Sin id de receta en la ruta se redirige al home y se setea error de URL
    Dado que no hay id de receta en la ruta
    Cuando el componente RecipeDetail se inicializa
    Entonces se debe redirigir a /home
    Y el estado de error debe contener "Error de URL"
    Y isLoading debe ser false

  Escenario: Fallo del servicio al cargar la receta setea un error genérico
    Dado que el servicio lanzará un error de red al consultar la receta "r1"
    Cuando el componente RecipeDetail se inicializa con id "r1" en la ruta
    Entonces el estado de error debe contener "Hubo un problema"
    Y isLoading debe ser false
