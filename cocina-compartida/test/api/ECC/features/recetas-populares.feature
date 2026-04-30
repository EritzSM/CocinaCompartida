# language: es
Característica: Recetas populares - Contrato API Frontend
  Como usuario del frontend Angular con patrón Screenplay
  Quiero verificar que el servicio consulte el endpoint correcto para las recetas populares
  Para garantizar el contrato con la API de recetas populares

  Escenario: loadTopLikedRecipes consulta el endpoint correcto y retorna las recetas
    Dado que el endpoint GET /api/recipes/top-liked está disponible
    Cuando se solicitan las recetas más populares
    Entonces la solicitud debe ser GET a /api/recipes/top-liked
    Y el resultado debe contener la lista de recetas populares

  Escenario: Fallo de la API retorna un array vacío
    Dado que el endpoint GET /api/recipes/top-liked responderá con error 500
    Cuando se solicitan las recetas más populares
    Entonces el resultado debe ser una lista vacía
