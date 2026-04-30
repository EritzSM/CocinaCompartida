import { Actor, Tarea } from '../../actor/Actor';
import { ConsumeApi } from '../../abilities/ConsumeApi';

export class EliminarReceta {
  private token?: string;

  private constructor(private readonly id: string) {}

  static conId(id: string): EliminarReceta {
    return new EliminarReceta(id);
  }

  autenticadoCon(token: string): EliminarReceta {
    this.token = token;
    return this;
  }

  comoTarea(): Tarea {
    return async (actor: Actor) => {
      const api = actor.usar<ConsumeApi>(ConsumeApi.CLAVE);
      let peticion = api.delete(`/recipes/${this.id}`);
      if (this.token) {
        peticion = peticion.set('Authorization', `Bearer ${this.token}`);
      }

      const inicio = Date.now();
      const respuesta = await peticion.send();
      (respuesta as any).duration = Date.now() - inicio;
      return respuesta;
    };
  }
}
