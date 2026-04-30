export class Afirmar<T> {
  private constructor(private readonly actual: T) {}

  static que<T>(actual: T): Afirmar<T> {
    return new Afirmar(actual);
  }

  esIgualA(esperado: unknown): void {
    expect(this.actual).toBe(esperado);
  }

  esEquivalenteA(esperado: unknown): void {
    expect(this.actual).toEqual(esperado);
  }

  contieneObjeto(esperado: object): void {
    expect(this.actual).toEqual(expect.objectContaining(esperado));
  }

  contiene(esperado: unknown): void {
    expect(this.actual as any).toContain(esperado);
  }

  tienePropiedad(propiedad: string): void {
    expect(this.actual).toHaveProperty(propiedad);
  }

  noTienePropiedad(propiedad: string): void {
    expect(this.actual).not.toHaveProperty(propiedad);
  }

  fueLlamado(): void {
    expect(this.actual).toHaveBeenCalled();
  }

  fueLlamadoCon(...args: unknown[]): void {
    expect(this.actual).toHaveBeenCalledWith(...args);
  }

  async rechazaCon(error: any): Promise<void> {
    await expect(this.actual).rejects.toThrow(error);
  }

  esMenorQue(esperado: number): void {
    expect(this.actual).toBeLessThan(esperado);
  }

  esIndefinido(): void {
    expect(this.actual).toBeUndefined();
  }

  esCadena(): void {
    expect(typeof this.actual).toBe('string');
  }

  esUnArreglo(): void {
    expect(Array.isArray(this.actual)).toBe(true);
  }

  tieneElementos(): void {
    expect((this.actual as any[]).length).toBeGreaterThan(0);
  }
}
