# language: es

Funcionalidad: Recipe CRUD con propiedad
  Como cocinero autenticado
  Quiero crear, consultar, editar y borrar mis recetas
  Para administrar solo el contenido que me pertenece

  Antecedentes:
    Dado que el cocinero esta registrado
    Y tiene un JWT valido

  Escenario: Crear receta con categoria
    Cuando envia "POST /recipes" con nombre, descripcion, ingredientes, pasos y categoria
    Entonces debe recibir codigo HTTP 201
    Y la receta debe quedar asociada al cocinero autenticado
    Y la categoria debe conservarse

  Escenario: Editar receta propia
    Dado que el cocinero es duenio de la receta
    Cuando envia "PATCH /recipes/:id" con cambios validos
    Entonces la receta debe actualizarse
    Y debe conservar el mismo duenio

  Escenario: Borrar receta propia
    Dado que el cocinero es duenio de la receta
    Cuando envia "DELETE /recipes/:id"
    Entonces debe recibir una respuesta exitosa sin contenido
    Y la receta no debe consultarse nuevamente

  Escenario: Bloquear modificacion de receta ajena
    Dado que otro usuario es duenio de la receta
    Cuando el cocinero intenta editarla o borrarla
    Entonces debe recibir codigo HTTP 403
