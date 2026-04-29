# language: es

Funcionalidad: Categorias y etiquetas de recetas
  Como usuario de Cocina Compartida
  Quiero clasificar y filtrar recetas por categoria o etiqueta
  Para encontrar recetas segun el momento de consumo

  Antecedentes:
    Dado que existen recetas con categorias como desayuno, cena, entradas y platos fuertes

  Escenario: Crear receta clasificada
    Cuando un cocinero crea una receta con categoria "desayuno"
    Entonces la receta debe conservar la categoria "desayuno"

  Escenario: Editar categoria de una receta propia
    Dado que el cocinero es duenio de la receta
    Cuando cambia la categoria a "cena"
    Entonces el detalle y el listado deben reflejar "cena"

  Escenario: Filtrar por etiqueta
    Dado que existen recetas etiquetadas con "desayuno"
    Cuando se filtra por la etiqueta "desayuno"
    Entonces solo deben retornar recetas con esa etiqueta
