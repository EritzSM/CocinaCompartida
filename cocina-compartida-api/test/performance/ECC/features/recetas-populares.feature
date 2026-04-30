# language: es
Característica: Recetas populares - Rendimiento Backend
  Como ingeniero de calidad que verifica el rendimiento del sistema
  Quiero verificar que la consulta de recetas populares sea eficiente
  Para garantizar tiempos de respuesta aceptables bajo carga

  Escenario: 100 consultas secuenciales tienen latencia promedio menor a 5ms
    Dado que el repositorio contiene 50 recetas simuladas
    Y el número de iteraciones es 100
    Y el umbral de latencia promedio es 5 ms
    Cuando se realizan 100 consultas de recetas populares de forma secuencial
    Entonces la latencia promedio debe ser inferior a 5 ms

  Escenario: 50 consultas en paralelo deben finalizar en menos de 200ms
    Dado que el repositorio contiene 50 recetas simuladas
    Y el número de solicitudes concurrentes es 50
    Y el umbral de tiempo total es 200 ms
    Cuando se realizan 50 consultas de recetas populares de forma concurrente
    Entonces el tiempo total debe ser inferior a 200 ms
