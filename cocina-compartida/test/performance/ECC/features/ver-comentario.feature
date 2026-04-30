# language: es
Característica: Ver comentarios - Rendimiento Frontend
  Como ingeniero de calidad que verifica el rendimiento del frontend
  Quiero verificar que la carga de comentarios sea eficiente bajo carga
  Para garantizar tiempos de respuesta aceptables para el usuario

  Escenario: 20 consultas secuenciales tienen latencia promedio menor a 50ms
    Dado que el endpoint /api/recipes/r1/comments retorna 30 comentarios
    Y el número de iteraciones es 20
    Y el umbral de latencia promedio es 50 ms
    Cuando se solicitan los comentarios de la receta "r1" 20 veces de forma secuencial
    Entonces la latencia promedio debe ser inferior a 50 ms

  Escenario: 10 consultas en paralelo deben finalizar en menos de 300ms
    Dado que el endpoint /api/recipes/r1/comments retorna 30 comentarios
    Y el número de solicitudes concurrentes es 10
    Y el umbral de tiempo total es 300 ms
    Cuando se solicitan los comentarios de la receta "r1" 10 veces de forma concurrente
    Entonces el tiempo total debe ser inferior a 300 ms
