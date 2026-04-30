# language: es
Característica: Recetas populares - Seguridad Frontend
  Como desarrollador que verifica la seguridad del servicio de recetas
  Quiero asegurar que el endpoint público de recetas populares no requiera autenticación
  Para que cualquier usuario anónimo pueda acceder a las recetas más populares

  Escenario: La solicitud de recetas populares no envía header Authorization
    Dado que hay un token "token" en localStorage
    Cuando se solicitan las recetas más populares
    Entonces la solicitud al endpoint /api/recipes/top-liked no debe contener el header Authorization

  Escenario: Fallo del endpoint retorna array vacío sin exponer detalles del error
    Dado que el endpoint GET /api/recipes/top-liked responderá con error 500
    Cuando se solicitan las recetas más populares
    Entonces el resultado debe ser una lista vacía
