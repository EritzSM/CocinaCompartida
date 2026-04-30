# language: es
Característica: Recetas populares - Seguridad Backend
  Como sistema de seguridad NestJS
  Quiero verificar que el parámetro limit sea validado para prevenir entradas maliciosas
  Para proteger al sistema de consultas con parámetros inválidos

  Escenario: Limit igual a cero es rechazado con BadRequestException
    Dado que el servicio de recetas está disponible
    Cuando se solicitan las recetas populares con limit 0
    Entonces el servicio debe lanzar BadRequestException
    Y el repositorio no debe haber sido consultado

  Escenario: Limit negativo es rechazado con BadRequestException
    Dado que el servicio de recetas está disponible
    Cuando se solicitan las recetas populares con limit -1
    Entonces el servicio debe lanzar BadRequestException
    Y el repositorio no debe haber sido consultado
