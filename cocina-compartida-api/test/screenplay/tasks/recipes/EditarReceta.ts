import { Actor, Tarea } from '../../actor/Actor';
import { ConsumeApi } from '../../abilities/ConsumeApi';

export class EditarReceta {
  private token?: string;

  private constructor(
    private readonly id: string,
    private readonly dto: unknown,
  ) {}

  static conId(id: string, dto: unknown): EditarReceta {
    return new EditarReceta(id, dto);
  }

  autenticadoCon(token: string): EditarReceta {
    this.token = token;
    return this;
  }

  comoTarea(): Tarea {
    return async (actor: Actor) => {
      const api = actor.usar<ConsumeApi>(ConsumeApi.CLAVE);
      let peticion = api.patch(`/recipes/${this.id}`);
      if (this.token) {
        peticion = peticion.set('Authorization', `Bearer ${this.token}`);
      }

      const inicio = Date.now();
      const respuesta = await peticion.send(this.dto);
      (respuesta as any).duration = Date.now() - inicio;
      return respuesta;
    };
  }
}
