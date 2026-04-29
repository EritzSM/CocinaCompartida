# language: es

Funcionalidad: Explorar recetas
  Como visitante de Cocina Compartida
  Quiero navegar el listado publico de recetas
  Para encontrar preparaciones relevantes por busqueda, categoria y ordenamiento

  Antecedentes:
    Dado que existen recetas publicadas con nombre, descripcion, categoria, autor y likes

  Escenario: Listar recetas publicas
    Cuando el visitante consulta "GET /recipes"
    Entonces debe recibir codigo HTTP 200
    Y debe recibir una lista de recetas
    Y cada receta debe conservar nombre, descripcion, categoria y autor

  Escenario: Explorar sin autenticacion
    Dado que el visitante no tiene token JWT
    Cuando consulta "GET /recipes"
    Entonces la consulta debe permitirse
    Y no debe recibir codigo HTTP 401

  Esquema del escenario: Ordenar o filtrar recetas en frontend
    Dado que hay recetas en la vista Explore
    Cuando el usuario aplica el criterio "<criterio>"
    Entonces la lista visible debe respetar "<resultado>"

    Ejemplos:
      | criterio        | resultado                  |
      | busqueda texto  | coincidencias relevantes   |
      | categoria       | solo esa categoria         |
      | likes           | mayor cantidad primero     |
      | recientes       | recetas recientes primero  |
