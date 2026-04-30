# language: es
Característica: Editar perfil - Rendimiento Backend
  Como ingeniero de calidad que verifica el rendimiento del servicio
  Quiero verificar que la operación de edición de perfil sea eficiente
  Para garantizar tiempos de respuesta aceptables bajo carga

  Escenario: 100 actualizaciones secuenciales deben tener latencia promedio menor a 5ms
    Dado que el servicio de usuarios está disponible con repositorio simulado
    Y el número de iteraciones es 100
    Y el umbral de latencia promedio es 5 ms
    Cuando se ejecutan 100 actualizaciones de perfil de forma secuencial
    Entonces la latencia promedio debe ser inferior a 5 ms

  Escenario: 50 actualizaciones en paralelo deben finalizar en menos de 200ms
    Dado que el servicio de usuarios está disponible con repositorio simulado
    Y el número de solicitudes concurrentes es 50
    Y el umbral de tiempo total es 200 ms
    Cuando se ejecutan 50 actualizaciones de perfil de forma concurrente
    Entonces el tiempo total debe ser inferior a 200 ms
