/**
 * Question Screenplay: Validar la respuesta de recetas populares.
 *
 * Extrae propiedades clave del body para aserciones fluidas:
 *   const populares = LasRecetasPopulares.desde(respuesta);
 *   esperar(populares.lista).seaUnArreglo();
 *   esperar(populares.lista).tengaAlMenos(1).elementos();
 *   esperar(populares.estaOrdenadaPorLikes).seaIgualA(true);
 */
export class LasRecetasPopulares {
  readonly status: number;
  readonly lista: any[];
  readonly duration: number;

  private constructor(respuesta: any) {
    this.status = respuesta.status;
    this.lista = Array.isArray(respuesta.body) ? respuesta.body : [];
    this.duration = respuesta.duration ?? 0;
  }

  /** Extrae las propiedades clave de la respuesta HTTP */
  static desde(respuesta: any): LasRecetasPopulares {
    return new LasRecetasPopulares(respuesta);
  }

  /** Obtiene la cantidad de recetas devueltas */
  get cantidad(): number {
    return this.lista.length;
  }

  /** Verifica si la lista está ordenada por likes de mayor a menor */
  get estaOrdenadaPorLikes(): boolean {
    for (let i = 1; i < this.lista.length; i++) {
      if ((this.lista[i - 1].likes ?? 0) < (this.lista[i].likes ?? 0)) {
        return false;
      }
    }
    return true;
  }

  /** Verifica si cada receta tiene las propiedades mínimas */
  get todasTienenContratoCompleto(): boolean {
    return this.lista.every(
      (r) =>
        r.hasOwnProperty('id') &&
        r.hasOwnProperty('name') &&
        r.hasOwnProperty('likes'),
    );
  }

  /** Obtiene el primer elemento de la lista */
  get primera(): any {
    return this.lista[0] ?? null;
  }
}
