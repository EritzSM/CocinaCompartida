# language: es
Característica: Editar perfil - Rendimiento Frontend
  Como ingeniero de calidad que verifica el rendimiento del frontend
  Quiero verificar que el servicio de edición de perfil sea eficiente bajo carga
  Para garantizar tiempos de respuesta aceptables para el usuario

  Escenario: 20 actualizaciones secuenciales tienen latencia promedio menor a 50ms
    Dado que el servicio de edición de perfil está configurado con token en localStorage
    Y el número de iteraciones es 20
    Y el umbral de latencia promedio es 50 ms
    Cuando se ejecutan 20 actualizaciones de perfil de forma secuencial
    Entonces la latencia promedio debe ser inferior a 50 ms

  Escenario: 10 actualizaciones en paralelo deben finalizar en menos de 300ms
    Dado que el servicio de edición de perfil está configurado con token en localStorage
    Y el número de solicitudes concurrentes es 10
    Y el umbral de tiempo total es 300 ms
    Cuando se ejecutan 10 actualizaciones de perfil de forma concurrente
    Entonces el tiempo total debe ser inferior a 300 ms
