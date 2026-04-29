# language: es

Funcionalidad: Favoritos y bookmarks
  Como usuario autenticado
  Quiero guardar recetas favoritas
  Para consultarlas luego desde mi perfil

  Antecedentes:
    Dado que existe una receta publicada
    Y el usuario tiene un JWT valido

  Escenario: Marcar receta como favorita
    Cuando el usuario envia "POST /recipes/:id/like"
    Entonces su id debe agregarse a "likedBy"
    Y el contador de likes debe aumentar

  Escenario: Quitar receta de favoritos
    Dado que el usuario ya esta en "likedBy"
    Cuando envia nuevamente "POST /recipes/:id/like"
    Entonces su id debe removerse de "likedBy"
    Y el contador de likes debe disminuir

  Escenario: Ver favoritos en perfil propio
    Dado que el usuario tiene recetas en "likedBy"
    Cuando abre la pestana Favoritos del perfil
    Entonces debe ver las recetas guardadas

  Escenario: Bloquear favorito sin autenticacion
    Dado que el visitante no tiene JWT
    Cuando intenta marcar favorito
    Entonces debe recibir codigo HTTP 401
