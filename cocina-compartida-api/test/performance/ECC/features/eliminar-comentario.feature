# language: es
Característica: Eliminar comentario - Rendimiento Backend
  Como ingeniero de calidad que verifica el rendimiento del servicio
  Quiero verificar que la operación de eliminación de comentarios sea eficiente
  Para garantizar tiempos de respuesta aceptables bajo carga

  Escenario: 100 eliminaciones secuenciales deben tener latencia promedio menor a 5ms
    Dado que el servicio de recetas está disponible con el comentario "c1" simulado
    Y el número de iteraciones es 100
    Y el umbral de latencia promedio es 5 ms
    Cuando el actor "chef" elimina 100 comentarios de forma secuencial
    Entonces la latencia promedio debe ser inferior a 5 ms

  Escenario: 50 eliminaciones en paralelo deben finalizar en menos de 200ms
    Dado que el servicio de recetas está disponible con el comentario "c1" simulado
    Y el número de solicitudes concurrentes es 50
    Y el umbral de tiempo total es 200 ms
    Cuando el actor "chef" elimina 50 comentarios de forma concurrente
    Entonces el tiempo total debe ser inferior a 200 ms
