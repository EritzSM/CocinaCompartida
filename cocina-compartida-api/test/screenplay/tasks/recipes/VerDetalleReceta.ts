import { Actor, Tarea } from '../../actor/Actor';
import { ConsumeApi } from '../../abilities/ConsumeApi';

export class VerDetalleReceta {
  private constructor(private readonly id: string) {}

  static conId(id: string): VerDetalleReceta {
    return new VerDetalleReceta(id);
  }

  ahora(): Tarea {
    return async (actor: Actor) => {
      const api = actor.usar<ConsumeApi>(ConsumeApi.CLAVE);
      const inicio = Date.now();
      const respuesta = await api.get(`/recipes/${this.id}`);
      (respuesta as any).duration = Date.now() - inicio;
      return respuesta;
    };
  }
}
