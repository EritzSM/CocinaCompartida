export type Tarea<T = any> = (actor: Actor) => Promise<T> | T;

export class Actor {
  private readonly habilidades = new Map<string, unknown>();

  private constructor(public readonly nombre: string) {}

  static llamado(nombre: string): Actor {
    return new Actor(nombre);
  }

  con(habilidad: { clave?: string; constructor: { name: string } }): Actor {
    this.habilidades.set(habilidad.clave ?? habilidad.constructor.name, habilidad);
    return this;
  }

  usar<T>(clave: string): T {
    const habilidad = this.habilidades.get(clave);
    if (!habilidad) {
      throw new Error(`El actor ${this.nombre} no tiene la habilidad ${clave}`);
    }

    return habilidad as T;
  }

  async intentar<T>(tarea: Tarea<T> | { comoTarea: () => Tarea<T> }): Promise<T> {
    const ejecutable = typeof tarea === 'function' ? tarea : tarea.comoTarea();
    return ejecutable(this);
  }
}
