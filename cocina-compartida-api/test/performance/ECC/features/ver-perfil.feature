# language: es
Característica: Ver perfil de usuario - Rendimiento Backend
  Como ingeniero de calidad que verifica el rendimiento del sistema
  Quiero verificar que la consulta de perfil sea eficiente
  Para garantizar tiempos de respuesta aceptables bajo carga

  Escenario: 100 consultas secuenciales tienen latencia promedio menor a 5ms
    Dado que el repositorio retorna el usuario con id "1" simulado
    Y el número de iteraciones es 100
    Y el umbral de latencia promedio es 5 ms
    Cuando se realizan 100 consultas de perfil de forma secuencial
    Entonces la latencia promedio debe ser inferior a 5 ms

  Escenario: 50 consultas en paralelo deben finalizar en menos de 200ms
    Dado que el repositorio retorna el usuario con id "1" simulado
    Y el número de solicitudes concurrentes es 50
    Y el umbral de tiempo total es 200 ms
    Cuando se realizan 50 consultas de perfil de forma concurrente
    Entonces el tiempo total debe ser inferior a 200 ms
