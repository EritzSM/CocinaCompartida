import { Actor } from '../../actor/Actor';
import { ConsumeApi } from '../../abilities/ConsumeApi';

/**
 * Patrón Screenplay — Task: ListarRecetas
 *
 * Tarea de alto nivel que encapsula la consulta pública
 * de la lista de recetas (/recipes GET).
 */
export class ListarRecetas {
  static ahora(): (actor: Actor) => Promise<{ status: number; body: any; duracionMs: number }> {
    return async (actor: Actor) => {
      const api = actor.usar<ConsumeApi>(ConsumeApi.CLAVE);
      const inicio = Date.now();
      const response = await api.get('/recipes');
      const duracionMs = Date.now() - inicio;
      return { status: response.status, body: response.body, duracionMs };
    };
  }
}
