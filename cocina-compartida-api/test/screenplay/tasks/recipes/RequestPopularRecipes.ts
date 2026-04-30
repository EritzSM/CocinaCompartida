import { Actor, Tarea } from '../../actor/Actor';
import { ConsumeApi } from '../../abilities/ConsumeApi';

/**
 * Task Screenplay: Consultar las recetas populares (top-liked).
 *
 * Uso: RequestPopularRecipes.fromApi()
 */
export class RequestPopularRecipes {
  /** Ejecuta GET /recipes/top-liked y mide duración */
  static fromApi(): Tarea {
    return async (actor: Actor) => {
      const api = actor.usar<ConsumeApi>(ConsumeApi.CLAVE);
      const inicio = Date.now();
      const respuesta = await api.get('/recipes/top-liked');
      (respuesta as any).duration = Date.now() - inicio;
      return respuesta;
    };
  }
}
