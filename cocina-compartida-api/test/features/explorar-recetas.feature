Feature: Explorar recetas
  Como visitante de Cocina Compartida
  Quiero navegar el listado publico de recetas
  Para encontrar preparaciones relevantes por busqueda, categoria y ordenamiento  Background:    Given que existen recetas publicadas con nombre, descripcion, categoria, autor y likes  Scenario: Listar recetas publicas    When el visitante consulta "GET /recipes"    Then debe recibir codigo HTTP 200    And debe recibir una lista de recetas    And cada receta debe conservar nombre, descripcion, categoria y autor  Scenario: Explorar sin autenticacion    Given que el visitante no tiene token JWT    When consulta "GET /recipes"    Then la consulta debe permitirse    And no debe recibir codigo HTTP 401  Scenario Outline: Ordenar o filtrar recetas en frontend    Given que hay recetas en la vista Explore    When el usuario aplica el criterio "<criterio>"    Then la lista visible debe respetar "<resultado>"    Examples:
      | criterio        | resultado                  |
      | busqueda texto  | coincidencias relevantes   |
      | categoria       | solo esa categoria         |
      | likes           | mayor cantidad primero     |
      | recientes       | recetas recientes primero  |
