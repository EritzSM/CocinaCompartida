# language: es

Funcionalidad: Detalle de receta
  Como visitante de Cocina Compartida
  Quiero ver el detalle completo de una receta
  Para revisar ingredientes, pasos y autor antes de cocinarla

  Antecedentes:
    Dado que existe una receta publicada con ingredientes, pasos y autor

  Escenario: Consultar detalle por id
    Cuando el visitante consulta "GET /recipes/:id"
    Entonces debe recibir codigo HTTP 200
    Y el cuerpo debe incluir nombre y descripcion
    Y el cuerpo debe incluir ingredientes
    Y el cuerpo debe incluir pasos
    Y el cuerpo debe incluir autor

  Escenario: Consultar receta inexistente
    Cuando el visitante consulta una receta inexistente
    Entonces debe recibir una respuesta controlada de no encontrado
    Y no debe recibir error interno 500

  Escenario: Mostrar acciones del duenio en frontend
    Dado que el usuario autenticado es duenio de la receta
    Cuando abre el detalle
    Entonces debe ver acciones para editar y eliminar
