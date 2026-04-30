# language: es
Característica: Recetas populares - Pruebas de Regresión Backend
  Como desarrollador que verifica la integridad del servicio
  Quiero asegurar que la consulta de recetas populares no se rompa
  Para proteger el comportamiento existente ante nuevos cambios

  Escenario: Hay recetas en el sistema y se retorna la lista completa
    Dado que existen las recetas "r1" con 10 likes y "r2" con 5 likes
    Cuando se solicitan las recetas más populares
    Entonces el resultado debe contener las recetas en la lista

  Escenario: Limit igual a cero provoca BadRequestException
    Dado que el servicio de recetas está disponible
    Cuando se solicitan las recetas populares con limit 0
    Entonces el servicio debe lanzar BadRequestException
