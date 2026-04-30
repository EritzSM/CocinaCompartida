import { Actor, Tarea } from '../../actor/Actor';
import { ConsumeApi } from '../../abilities/ConsumeApi';

export class ListarRecetasPopulares {
  static ahora(): Tarea {
    return async (actor: Actor) => {
      const api = actor.usar<ConsumeApi>(ConsumeApi.CLAVE);
      const inicio = Date.now();
      const respuesta = await api.get('/recipes/top-liked');
      (respuesta as any).duration = Date.now() - inicio;
      return respuesta;
    };
  }
}
