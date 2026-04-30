# language: es
Característica: Eliminar comentario - Rendimiento Frontend
  Como ingeniero de calidad que verifica el rendimiento del frontend
  Quiero verificar que el servicio de eliminación de comentarios sea eficiente
  Para garantizar tiempos de respuesta aceptables para el usuario

  Escenario: 20 eliminaciones secuenciales tienen latencia promedio menor a 50ms
    Dado que existen 20 comentarios en la receta "r1"
    Y el número de iteraciones es 20
    Y el umbral de latencia promedio es 50 ms
    Cuando se eliminan 20 comentarios de forma secuencial
    Entonces la latencia promedio debe ser inferior a 50 ms

  Escenario: 10 eliminaciones en paralelo deben finalizar en menos de 300ms
    Dado que existen 10 comentarios en la receta "r1"
    Y el número de solicitudes concurrentes es 10
    Y el umbral de tiempo total es 300 ms
    Cuando se eliminan 10 comentarios de forma concurrente
    Entonces el tiempo total debe ser inferior a 300 ms
