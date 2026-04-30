# language: es
Característica: Ver perfil - Contrato API Frontend
  Como usuario del frontend Angular con patrón Screenplay
  Quiero verificar que el componente solicite el perfil al servicio cuando hay id en la ruta
  Para garantizar el contrato con la API de perfil de usuario

  Escenario: Con id en la ruta se solicita el perfil por API y se identifica como perfil ajeno
    Dado que el actor "Ana" visita el perfil del usuario con id "99"
    Y el servicio retornará el perfil del usuario "otheruser"
    Cuando el componente Profile se inicializa con id "99" en la ruta
    Entonces fetchUserById debe haber sido llamado con "99"
    Y el perfil mostrado debe ser el del usuario "otheruser"
    Y isOwnProfile debe ser false

  Escenario: Sin id en la ruta no se llama a fetchUserById y se usa el usuario en cache
    Dado que el actor "Ana" visita su propio perfil sin id en la ruta
    Y tiene su usuario disponible en cache
    Cuando el componente Profile se inicializa sin id en la ruta
    Entonces fetchUserById no debe haber sido llamado
    Y el perfil mostrado debe ser el del usuario en cache
