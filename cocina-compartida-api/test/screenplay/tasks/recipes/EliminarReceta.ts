import { Actor } from '../../actor/Actor';
import { ConsumeApi } from '../../abilities/ConsumeApi';

export class EliminarReceta {
  private token: string | null = null;

  private constructor(private readonly recipeId: string) {}

  static conId(recipeId: string): EliminarReceta {
    return new EliminarReceta(recipeId);
  }

  autenticadoCon(token: string): EliminarReceta {
    this.token = token;
    return this;
  }

  comoTarea(): (actor: Actor) => Promise<{ status: number; body: any }> {
    return async (actor: Actor) => {
      const api = actor.usar<ConsumeApi>(ConsumeApi.CLAVE);
      let req = api.delete(`/recipes/${this.recipeId}`);
      if (this.token) {
        req = req.set('Authorization', `Bearer ${this.token}`);
      }
      const response = await req;
      return { status: response.status, body: response.body };
    };
  }
}
