# language: es
Característica: Eliminar comentario - Seguridad Frontend
  Como desarrollador que verifica la seguridad del servicio de interacción
  Quiero asegurar que solo se envíe la solicitud cuando hay un comentario válido y token correcto
  Para evitar eliminaciones no autorizadas o con datos inválidos

  Escenario: Id de comentario inexistente no envía DELETE y setea error en el estado
    Dado que existe la receta "r1" con el comentario "c1"
    Cuando se intenta eliminar el comentario con id "missing"
    Entonces la API no debe haber recibido ninguna solicitud DELETE
    Y el estado de error debe contener "El comentario no existe"

  Escenario: Token presente en localStorage se incluye en el header Authorization del DELETE
    Dado que el token "token" está almacenado en localStorage
    Y existe la receta "r1" con el comentario "c1"
    Cuando se elimina el comentario "c1"
    Entonces la solicitud DELETE debe incluir el header "Authorization: Bearer token"
