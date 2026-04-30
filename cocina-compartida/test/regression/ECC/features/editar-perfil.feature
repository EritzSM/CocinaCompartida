# language: es
Característica: Editar perfil - Regresión Frontend
  Como desarrollador que verifica la integridad del componente Profile
  Quiero asegurar que los flujos de edición de perfil no se rompan
  Para proteger el comportamiento existente ante nuevos cambios

  Escenario: Update exitoso actualiza el usuario y cierra el modal
    Dado que el actor "Ana" tiene el modal de edición abierto
    Y el servicio de edición retornará el perfil actualizado
    Y el nuevo username es "nuevo" y la nueva bio es "bio nueva"
    Cuando Ana guarda los cambios del perfil
    Entonces el usuario actual debe ser el perfil actualizado
    Y el modal de edición debe estar cerrado

  Escenario: Update fallido mantiene el usuario actual y el modal permanece abierto
    Dado que el actor "Ana" tiene el modal de edición abierto
    Y el servicio de edición retornará null indicando error
    Y el nuevo username es "nuevo"
    Cuando Ana guarda los cambios del perfil
    Entonces el usuario actual no debe haber cambiado
    Y el modal de edición debe seguir abierto
