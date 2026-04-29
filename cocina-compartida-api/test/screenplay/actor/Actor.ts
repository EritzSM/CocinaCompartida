/**
 * Patrón Screenplay — Actor
 *
 * El Actor es la pieza central del patrón. Representa a quien realiza
 * acciones sobre el sistema (usuario, administrador, visitante, etc.)
 * y lleva consigo las Habilidades (Abilities) que le permiten interactuar.
 */
export class Actor {
  private readonly nombre: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private habilidades: Map<string, any> = new Map();

  private constructor(nombre: string) {
    this.nombre = nombre;
  }

  /** Crea un nuevo actor con el nombre dado. */
  static llamado(nombre: string): Actor {
    return new Actor(nombre);
  }

  /** Equipa al actor con una o más habilidades (fluent). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  con(...habilidades: { clave: string; instancia: any }[]): Actor {
    habilidades.forEach((h) => this.habilidades.set(h.clave, h.instancia));
    return this;
  }

  /** Recupera una habilidad previamente registrada. */
  usar<T>(clave: string): T {
    const habilidad = this.habilidades.get(clave);
    if (!habilidad) {
      throw new Error(
        `[Actor:${this.nombre}] No tiene la habilidad "${clave}". ` +
          `Registra la habilidad con .con(...) antes de usarla.`,
      );
    }
    return habilidad as T;
  }

  /**
   * Ejecuta una Tarea o Pregunta — cualquier callable que reciba al Actor.
   * Devuelve lo que retorne la tarea (tipado genérico).
   */
  async intentar<T>(tarea: (actor: Actor) => Promise<T>): Promise<T> {
    return tarea(this);
  }

  toString(): string {
    return `Actor(${this.nombre})`;
  }
}
