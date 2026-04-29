import { Actor } from '../../actor/Actor';
import { ConsumeApi } from '../../abilities/ConsumeApi';

export class MarcarRecetaComoFavorita {
  private token: string | null = null;

  private constructor(private readonly recipeId: string) {}

  static conId(recipeId: string): MarcarRecetaComoFavorita {
    return new MarcarRecetaComoFavorita(recipeId);
  }

  autenticadoCon(token: string): MarcarRecetaComoFavorita {
    this.token = token;
    return this;
  }

  comoTarea(): (actor: Actor) => Promise<{ status: number; body: any; duracionMs: number }> {
    return async (actor: Actor) => {
      const api = actor.usar<ConsumeApi>(ConsumeApi.CLAVE);
      const inicio = Date.now();
      let req = api.post(`/recipes/${this.recipeId}/like`).send({});
      if (this.token) {
        req = req.set('Authorization', `Bearer ${this.token}`);
      }
      const response = await req;
      return { status: response.status, body: response.body, duracionMs: Date.now() - inicio };
    };
  }
}
