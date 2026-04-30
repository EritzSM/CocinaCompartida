# language: es
Característica: Listar usuarios admin - Rendimiento Backend
  Como administrador que verifica el rendimiento del listado de usuarios
  Quiero verificar que la operación de listado sea eficiente con datasets grandes
  Para garantizar tiempos de respuesta aceptables bajo carga

  Escenario: 100 listados secuenciales con 200 usuarios tienen latencia promedio menor a 5ms
    Dado que el repositorio contiene 200 usuarios simulados
    Y el número de iteraciones es 100
    Y el umbral de latencia promedio es 5 ms
    Cuando se realizan 100 listados de usuarios de forma secuencial
    Entonces la latencia promedio debe ser inferior a 5 ms

  Escenario: 50 listados en paralelo deben finalizar en menos de 200ms
    Dado que el repositorio de usuarios está disponible
    Y el número de solicitudes concurrentes es 50
    Y el umbral de tiempo total es 200 ms
    Cuando se realizan 50 listados de usuarios de forma concurrente
    Entonces el tiempo total debe ser inferior a 200 ms
