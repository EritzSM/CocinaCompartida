# language: es
Característica: Listar usuarios admin - Pruebas de Regresión Backend
  Como administrador que verifica la integridad del servicio
  Quiero asegurar que el listado de usuarios no exponga datos sensibles
  Para proteger la privacidad de los usuarios del sistema

  Escenario: Los usuarios retornados no contienen el campo password
    Dado que existen 2 usuarios con password hasheado en el repositorio
    Cuando se solicita la lista completa de usuarios
    Entonces cada usuario en la lista no debe contener el campo "password"

  Escenario: Lista vacía cuando no hay usuarios registrados
    Dado que no existe ningún usuario en el repositorio
    Cuando se solicita la lista completa de usuarios
    Entonces el resultado debe ser una lista vacía
