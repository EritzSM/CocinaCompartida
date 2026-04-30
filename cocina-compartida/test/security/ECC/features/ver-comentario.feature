# language: es
Característica: Ver comentarios - Seguridad Frontend
  Como desarrollador que verifica la seguridad del servicio de interacción
  Quiero asegurar que el endpoint público de comentarios no requiera autenticación
  Para que cualquier usuario pueda ver los comentarios de las recetas sin estar autenticado

  Escenario: La carga de comentarios no envía header Authorization
    Dado que hay un token "token" en localStorage
    Cuando se solicitan los comentarios de la receta "r1"
    Entonces la solicitud al endpoint /api/recipes/r1/comments no debe contener el header Authorization

  Escenario: Fallo del endpoint retorna lista vacía sin exponer detalles del error
    Dado que el endpoint GET /api/recipes/r1/comments responderá con error 500
    Cuando se solicitan los comentarios de la receta "r1"
    Entonces el resultado debe ser una lista vacía
