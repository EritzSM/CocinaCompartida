# language: es
Característica: Editar perfil - Seguridad Frontend
  Como desarrollador que verifica la seguridad del componente Profile
  Quiero asegurar que la validación de datos proteja el sistema ante entradas inválidas
  Para evitar actualizaciones con datos incorrectos o inseguros

  Escenario: Username demasiado corto bloquea la actualización del perfil
    Dado que el actor "Ana" intenta guardar el perfil con username "ab"
    Cuando Ana guarda los cambios del perfil
    Entonces updateProfile no debe haber sido llamado

  Escenario: Password vacía o con solo espacios no se incluye en el payload enviado
    Dado que el actor "Ana" intenta guardar el perfil con password "   " y username "nuevo"
    Cuando Ana guarda los cambios del perfil
    Entonces el payload enviado a updateProfile no debe contener el campo "password"
