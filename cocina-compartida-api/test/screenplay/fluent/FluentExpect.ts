// ═══════════════════════════════════════════════════════════════════════════
// FluentExpect — Aserciones fluidas en español para la suite BDD
// Uso: esperar(valor).seaExitoso(), esperar(lista).tengaAlMenos(1).elementos()
// ═══════════════════════════════════════════════════════════════════════════

export class FluentExpect<T> {
  private _cantidad?: number;

  private constructor(private readonly actual: T) {}

  /** Punto de entrada: esperar(valor) */
  static que<T>(actual: T): FluentExpect<T> {
    return new FluentExpect(actual);
  }

  // ─── Status & Éxito ────────────────────────────────────────────────────────

  /** Verifica que el status HTTP sea 2xx */
  seaExitoso(): FluentExpect<T> {
    const status = (this.actual as any)?.status ?? this.actual;
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(300);
    return this;
  }

  /** Verifica que el status sea exactamente el dado */
  tengaStatus(esperado: number): FluentExpect<T> {
    const status = (this.actual as any)?.status ?? this.actual;
    expect(status).toBe(esperado);
    return this;
  }

  // ─── Igualdad ──────────────────────────────────────────────────────────────

  /** Verifica igualdad estricta (===) */
  seaIgualA(esperado: unknown): FluentExpect<T> {
    expect(this.actual).toBe(esperado);
    return this;
  }

  /** Verifica igualdad profunda */
  seaEquivalenteA(esperado: unknown): FluentExpect<T> {
    expect(this.actual).toEqual(esperado);
    return this;
  }

  // ─── Tipo ──────────────────────────────────────────────────────────────────

  /** Verifica que sea un string */
  seaCadena(): FluentExpect<T> {
    expect(typeof this.actual).toBe('string');
    return this;
  }

  /** Verifica que sea un número */
  seaNumero(): FluentExpect<T> {
    expect(typeof this.actual).toBe('number');
    return this;
  }

  /** Verifica que sea un arreglo */
  seaUnArreglo(): FluentExpect<T> {
    expect(Array.isArray(this.actual)).toBe(true);
    return this;
  }

  /** Verifica que esté definido (no undefined/null) */
  esteDefinido(): FluentExpect<T> {
    expect(this.actual).toBeDefined();
    expect(this.actual).not.toBeNull();
    return this;
  }

  // ─── Propiedades ───────────────────────────────────────────────────────────

  /** Verifica que el objeto tenga una propiedad */
  tengaPropiedad(nombre: string): FluentExpect<T> {
    expect(this.actual).toHaveProperty(nombre);
    return this;
  }

  /** Verifica que el objeto NO tenga una propiedad */
  noTengaPropiedad(nombre: string): FluentExpect<T> {
    expect(this.actual).not.toHaveProperty(nombre);
    return this;
  }

  // ─── Contenido ─────────────────────────────────────────────────────────────

  /** Verifica que contenga un substring o elemento */
  contenga(esperado: unknown): FluentExpect<T> {
    expect(this.actual as any).toContain(esperado);
    return this;
  }

  /** Verifica que contenga un objeto parcial */
  contengaObjeto(esperado: object): FluentExpect<T> {
    expect(this.actual).toEqual(expect.objectContaining(esperado));
    return this;
  }

  // ─── Colecciones ───────────────────────────────────────────────────────────

  /** Establece la cantidad para la siguiente aserción */
  tengaAlMenos(n: number): FluentExpect<T> {
    this._cantidad = n;
    return this;
  }

  /** Verifica que el array tenga al menos _cantidad elementos */
  elementos(): FluentExpect<T> {
    const arr = this.actual as unknown as any[];
    expect(Array.isArray(arr)).toBe(true);
    if (this._cantidad !== undefined) {
      expect(arr.length).toBeGreaterThanOrEqual(this._cantidad);
    }
    return this;
  }

  /** Verifica que el arreglo tenga exactamente n elementos */
  tengaExactamente(n: number): FluentExpect<T> {
    const arr = this.actual as unknown as any[];
    expect(arr.length).toBe(n);
    return this;
  }

  /** Verifica que el arreglo tenga como máximo n elementos */
  tengaComoMaximo(n: number): FluentExpect<T> {
    const arr = this.actual as unknown as any[];
    expect(arr.length).toBeLessThanOrEqual(n);
    return this;
  }

  // ─── Comparaciones numéricas ───────────────────────────────────────────────

  /** Verifica que sea menor que */
  seaMenorQue(esperado: number): FluentExpect<T> {
    expect(this.actual as unknown as number).toBeLessThan(esperado);
    return this;
  }

  /** Verifica que sea mayor o igual que */
  seaMayorOIgualQue(esperado: number): FluentExpect<T> {
    expect(this.actual as unknown as number).toBeGreaterThanOrEqual(esperado);
    return this;
  }

  // ─── JWT ───────────────────────────────────────────────────────────────────

  /** Verifica que el string tenga formato de JWT (3 segmentos separados por .) */
  seaUnJwtValido(): FluentExpect<T> {
    expect(typeof this.actual).toBe('string');
    const segmentos = (this.actual as unknown as string).split('.');
    expect(segmentos.length).toBe(3);
    expect(segmentos[0].length).toBeGreaterThan(0);
    expect(segmentos[1].length).toBeGreaterThan(0);
    expect(segmentos[2].length).toBeGreaterThan(0);
    return this;
  }

  // ─── Negación ──────────────────────────────────────────────────────────────

  /** Verifica que NO sea igual */
  noSeaIgualA(esperado: unknown): FluentExpect<T> {
    expect(this.actual).not.toBe(esperado);
    return this;
  }

  /** Verifica que NO esté vacío (string o array) */
  noEsteVacio(): FluentExpect<T> {
    if (typeof this.actual === 'string') {
      expect(this.actual.length).toBeGreaterThan(0);
    } else if (Array.isArray(this.actual)) {
      expect(this.actual.length).toBeGreaterThan(0);
    }
    return this;
  }
}

/** Alias en español para FluentExpect.que() — Punto de entrada principal */
export function esperar<T>(actual: T): FluentExpect<T> {
  return FluentExpect.que(actual);
}
