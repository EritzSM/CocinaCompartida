import { Actor, Tarea } from '../../actor/Actor';
import { ConsumeApi } from '../../abilities/ConsumeApi';

export class ListarRecetas {
  static ahora(): Tarea {
    return async (actor: Actor) => {
      const api = actor.usar<ConsumeApi>(ConsumeApi.CLAVE);
      const inicio = Date.now();
      const respuesta = await api.get('/recipes');
      (respuesta as any).duration = Date.now() - inicio;
      return respuesta;
    };
  }
}
