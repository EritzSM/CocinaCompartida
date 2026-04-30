# language: es
Característica: Ver comentarios - Rendimiento Backend
  Como ingeniero de calidad que verifica el rendimiento del sistema
  Quiero verificar que la consulta de comentarios sea eficiente
  Para garantizar tiempos de respuesta aceptables bajo carga

  Escenario: 100 consultas secuenciales tienen latencia promedio menor a 5ms
    Dado que la receta "r1" existe con 50 comentarios simulados
    Y el número de iteraciones es 100
    Y el umbral de latencia promedio es 5 ms
    Cuando se realizan 100 consultas de comentarios de la receta "r1" de forma secuencial
    Entonces la latencia promedio debe ser inferior a 5 ms

  Escenario: 50 consultas en paralelo deben finalizar en menos de 200ms
    Dado que la receta "r1" existe con 50 comentarios simulados
    Y el número de solicitudes concurrentes es 50
    Y el umbral de tiempo total es 200 ms
    Cuando se realizan 50 consultas de comentarios de la receta "r1" de forma concurrente
    Entonces el tiempo total debe ser inferior a 200 ms
