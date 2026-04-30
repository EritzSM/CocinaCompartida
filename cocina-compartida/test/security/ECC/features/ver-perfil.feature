# language: es
Característica: Ver perfil - Seguridad Frontend
  Como desarrollador que verifica la seguridad del componente Profile
  Quiero asegurar que los permisos de visualización se apliquen correctamente
  Para proteger la privacidad y los datos de los usuarios

  Escenario: Respuesta unauthorized del servicio redirige al home y limpia el usuario
    Dado que el actor visita el perfil del usuario con id "99"
    Y el servicio retornará "unauthorized"
    Cuando el componente Profile se inicializa con id "99"
    Entonces el usuario debe ser null
    Y se debe redirigir a /home

  Escenario: Perfil ajeno no muestra los favoritos del usuario actual
    Dado que el actor "Ana" con id "1" visita el perfil del usuario "otheruser" con id "99"
    Y existen recetas con likedBy de Ana
    Cuando el componente Profile se inicializa con id "99"
    Entonces isOwnProfile debe ser false
    Y la lista de recetas favoritas del componente debe estar vacía
