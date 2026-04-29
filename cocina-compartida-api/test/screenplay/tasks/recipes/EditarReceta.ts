import { Actor } from '../../actor/Actor';
import { ConsumeApi } from '../../abilities/ConsumeApi';

export class EditarReceta {
  private token: string | null = null;

  private constructor(
    private readonly recipeId: string,
    private readonly cambios: Record<string, any>,
  ) {}

  static conId(recipeId: string, cambios: Record<string, any>): EditarReceta {
    return new EditarReceta(recipeId, cambios);
  }

  autenticadoCon(token: string): EditarReceta {
    this.token = token;
    return this;
  }

  comoTarea(): (actor: Actor) => Promise<{ status: number; body: any }> {
    return async (actor: Actor) => {
      const api = actor.usar<ConsumeApi>(ConsumeApi.CLAVE);
      let req = api.patch(`/recipes/${this.recipeId}`).send(this.cambios);
      if (this.token) {
        req = req.set('Authorization', `Bearer ${this.token}`);
      }
      const response = await req;
      return { status: response.status, body: response.body };
    };
  }
}
