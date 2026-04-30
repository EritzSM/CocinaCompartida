import { Actor, Tarea } from '../../actor/Actor';
import { ConsumeApi } from '../../abilities/ConsumeApi';

export class CrearReceta {
  private token?: string;

  private constructor(private readonly dto: unknown) {}

  static con(dto: unknown): CrearReceta {
    return new CrearReceta(dto);
  }

  autenticadoCon(token: string): CrearReceta {
    this.token = token;
    return this;
  }

  comoTarea(): Tarea {
    return async (actor: Actor) => {
      const api = actor.usar<ConsumeApi>(ConsumeApi.CLAVE);
      let peticion = api.post('/recipes');
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
