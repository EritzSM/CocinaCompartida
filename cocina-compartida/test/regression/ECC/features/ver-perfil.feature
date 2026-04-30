# language: es
Característica: Ver perfil de usuario - Regresión Frontend
  Como desarrollador que verifica la integridad del componente Profile
  Quiero asegurar que la carga del perfil no se rompa ante distintos escenarios
  Para proteger el comportamiento existente ante nuevos cambios

  Escenario: Perfil propio cargado desde cache sin redirecciones
    Dado que el actor "Ana" tiene su perfil en cache y no hay id en la ruta
    Cuando el componente Profile se inicializa
    Entonces el perfil mostrado debe ser el de Ana
    Y isOwnProfile debe ser true
    Y no debe haber ninguna redirección

  Escenario: Sin usuario en cache se invoca verifyLoggedUser para revalidar sesión
    Dado que no hay usuario en cache y no hay id en la ruta
    Cuando el componente Profile se inicializa
    Entonces verifyLoggedUser debe haber sido invocado

  Escenario: Usuario no encontrado por id redirige al home
    Dado que el actor visita el perfil del usuario con id "99"
    Y el servicio retornará null indicando que el usuario no existe
    Cuando el componente Profile se inicializa con id "99"
    Entonces el usuario debe ser null
    Y se debe redirigir a /home

  Escenario: Fallo del fetch del perfil restablece isOwnProfile y redirige al home
    Dado que el actor visita el perfil del usuario con id "99"
    Y el servicio lanzará un error de red
    Cuando el componente Profile se inicializa con id "99"
    Entonces isOwnProfile debe ser true
    Y se debe redirigir a /home
