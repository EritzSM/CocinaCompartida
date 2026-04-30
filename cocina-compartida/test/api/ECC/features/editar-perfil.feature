# language: es
Característica: Editar perfil - Contrato API Frontend
  Como usuario del frontend Angular con patrón Screenplay
  Quiero verificar que el servicio de edición envíe las solicitudes HTTP correctas
  Para garantizar el contrato con la API de edición de perfil

  Escenario: updateProfile envía PATCH con header Authorization y actualiza el estado
    Dado que el actor "Ana" tiene el token "token" en localStorage
    Y el endpoint PATCH /api/users responderá con el usuario actualizado
    Cuando Ana actualiza su perfil con username "nuevo"
    Entonces la solicitud debe ser PATCH a /api/users con header "Authorization: Bearer token"
    Y el estado del usuario actual debe actualizarse al nuevo perfil
    Y loadRecipes debe haber sido llamado

  Escenario: Fallo de la API retorna null y no modifica el usuario actual
    Dado que el actor "Ana" tiene el token "token" en localStorage
    Y el endpoint PATCH /api/users responderá con error 500
    Cuando Ana actualiza su perfil con username "nuevo"
    Entonces el resultado debe ser null
    Y el usuario actual no debe haber cambiado
