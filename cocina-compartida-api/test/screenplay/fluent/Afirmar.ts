/**
 * Fluent Assertions — Afirmar
 *
 * Wrapper sobre las assertions de Jest que expone una API
 * de encadenamiento legible como lenguaje natural.
 *
 * Uso:
 *   Afirmar.que(status).esIgualA(201)
 *   Afirmar.que(body).tienePropiedad('token')
 *   Afirmar.que(lista).esUnArreglo()
 *   Afirmar.que(lista).tieneElementos()
 *   Afirmar.que(duracion).esMenorQue(300)
 *   Afirmar.que(body).noTienePropiedad('password')
 *   Afirmar.que(mock).fueLlamadoCon('arg1', 'arg2')
 *   Afirmar.que(mock).fueLlamado()
 *   Afirmar.que(promesa).rechazaCon(ClaseDeError)
 */
export class Afirmar {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private constructor(private readonly valor: any) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static que(valor: any): Afirmar {
    return new Afirmar(valor);
  }

  /** El valor es estrictamente igual al esperado */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  esIgualA(esperado: any): this {
    expect(this.valor).toBe(esperado);
    return this;
  }

  /** El valor es profundamente igual al esperado (deep equality) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  esEquivalenteA(esperado: any): this {
    expect(this.valor).toEqual(esperado);
    return this;
  }

  /** El objeto tiene la propiedad indicada */
  tienePropiedad(propiedad: string): this {
    expect(this.valor).toHaveProperty(propiedad);
    return this;
  }

  /** El objeto NO tiene la propiedad indicada */
  noTienePropiedad(propiedad: string): this {
    expect(this.valor).not.toHaveProperty(propiedad);
    return this;
  }

  /** El string/mensaje contiene el texto indicado */
  contiene(texto: string): this {
    expect(this.valor).toContain(texto);
    return this;
  }

  /** El valor es un arreglo */
  esUnArreglo(): this {
    expect(Array.isArray(this.valor)).toBe(true);
    return this;
  }

  /** El arreglo tiene al menos un elemento */
  tieneElementos(): this {
    expect(this.valor.length).toBeGreaterThan(0);
    return this;
  }

  /** El número es menor que el límite dado */
  esMenorQue(limite: number): this {
    expect(this.valor).toBeLessThan(limite);
    return this;
  }

  /** El valor es de tipo string */
  esCadena(): this {
    expect(typeof this.valor).toBe('string');
    return this;
  }

  /** El valor es undefined */
  esIndefinido(): this {
    expect(this.valor).toBeUndefined();
    return this;
  }

  /** El mock fue llamado al menos una vez */
  fueLlamado(): this {
    expect(this.valor).toHaveBeenCalled();
    return this;
  }

  /** El mock fue llamado con los argumentos indicados */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fueLlamadoCon(...args: any[]): this {
    expect(this.valor).toHaveBeenCalledWith(...args);
    return this;
  }

  /**
   * La promesa rechaza con el tipo de error indicado.
   * (Asíncrono — retorna Promise<void>)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async rechazaCon(TipoDeError: new (...args: any[]) => Error): Promise<void> {
    await expect(this.valor).rejects.toThrow(TipoDeError);
  }

  /** El objeto contiene las propiedades indicadas (objectContaining) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contieneObjeto(parcial: Record<string, any>): this {
    expect(this.valor).toEqual(expect.objectContaining(parcial));
    return this;
  }
}
