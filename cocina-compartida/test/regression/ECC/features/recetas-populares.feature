# language: es
Característica: Recetas populares - Regresión Frontend
  Como desarrollador que verifica la integridad del componente Home
  Quiero asegurar que el cálculo del top 3 de recetas sea correcto
  Para proteger el comportamiento existente ante nuevos cambios

  Escenario: Con más de 3 recetas se retorna el top 3 ordenado por likes descendente
    Dado que existen 4 recetas con likes 10, 25, 5 y 50 respectivamente
    Cuando el componente Home calcula las recetas destacadas
    Entonces el resultado debe contener exactamente 3 recetas
    Y la primera receta debe ser la de 50 likes
    Y la segunda receta debe ser la de 25 likes

  Escenario: Recetas con likes NaN se tratan como 0 en el ordenamiento
    Dado que existe una receta con likes NaN entre otras recetas con likes válidos
    Cuando el componente Home calcula las recetas destacadas
    Entonces la receta con likes NaN debe aparecer al final de la lista
