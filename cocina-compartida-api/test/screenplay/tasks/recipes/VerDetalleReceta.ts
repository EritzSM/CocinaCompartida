import { Actor } from '../../actor/Actor';
import { ConsumeApi } from '../../abilities/ConsumeApi';

export class VerDetalleReceta {
  private constructor(private readonly recipeId: string) {}

  static conId(recipeId: string): VerDetalleReceta {
    return new VerDetalleReceta(recipeId);
  }

  ahora(): (actor: Actor) => Promise<{ status: number; body: any; duracionMs: number }> {
    return async (actor: Actor) => {
      const api = actor.usar<ConsumeApi>(ConsumeApi.CLAVE);
      const inicio = Date.now();
      const response = await api.get(`/recipes/${this.recipeId}`);
      const duracionMs = Date.now() - inicio;
      return { status: response.status, body: response.body, duracionMs };
    };
  }
}
