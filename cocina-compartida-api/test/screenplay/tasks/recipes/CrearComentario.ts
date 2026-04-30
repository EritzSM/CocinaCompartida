import { Actor, Tarea } from '../../actor/Actor';
import { ConsumeApi } from '../../abilities/ConsumeApi';

export class CrearComentario {
  private token?: string;

  private constructor(
    private readonly recipeId: string,
    private readonly dto: unknown,
  ) {}

  static en(recipeId: string): { con: (dto: unknown) => CrearComentario } {
    return {
      con: (dto: unknown) => new CrearComentario(recipeId, dto),
    };
  }

  autenticadoCon(token: string): CrearComentario {
    this.token = token;
    return this;
  }

  comoTarea(): Tarea {
    return async (actor: Actor) => {
      const api = actor.usar<ConsumeApi>(ConsumeApi.CLAVE);
      let peticion = api.post(`/recipes/${this.recipeId}/comments`);
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
