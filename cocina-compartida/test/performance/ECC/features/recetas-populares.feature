# language: es
Característica: Recetas populares - Rendimiento Frontend
  Como ingeniero de calidad que verifica el rendimiento del frontend
  Quiero verificar que la carga de recetas populares sea eficiente
  Para garantizar tiempos de respuesta aceptables para el usuario

  Escenario: 20 consultas secuenciales tienen latencia promedio menor a 50ms
    Dado que el endpoint /api/recipes/top-liked retorna 25 recetas
    Y el número de iteraciones es 20
    Y el umbral de latencia promedio es 50 ms
    Cuando se solicitan las recetas populares 20 veces de forma secuencial
    Entonces la latencia promedio debe ser inferior a 50 ms

  Escenario: 10 consultas en paralelo deben finalizar en menos de 300ms
    Dado que el endpoint /api/recipes/top-liked retorna 25 recetas
    Y el número de solicitudes concurrentes es 10
    Y el umbral de tiempo total es 300 ms
    Cuando se solicitan las recetas populares 10 veces de forma concurrente
    Entonces el tiempo total debe ser inferior a 300 ms
