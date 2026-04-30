# language: es
Característica: Ver perfil de usuario - Rendimiento Frontend
  Como ingeniero de calidad que verifica el rendimiento del frontend
  Quiero verificar que la carga de perfiles sea eficiente bajo carga
  Para garantizar tiempos de respuesta aceptables para el usuario

  Escenario: 20 consultas secuenciales de perfiles tienen latencia promedio menor a 50ms
    Dado que el servicio de edición de perfil está configurado
    Y el número de iteraciones es 20
    Y el umbral de latencia promedio es 50 ms
    Cuando se consultan 20 perfiles de usuarios diferentes de forma secuencial
    Entonces la latencia promedio debe ser inferior a 50 ms

  Escenario: 10 consultas en paralelo de perfiles deben finalizar en menos de 300ms
    Dado que el servicio de edición de perfil está configurado
    Y el número de solicitudes concurrentes es 10
    Y el umbral de tiempo total es 300 ms
    Cuando se consultan 10 perfiles de usuarios diferentes de forma concurrente
    Entonces el tiempo total debe ser inferior a 300 ms
