import { Actor, Tarea } from '../../actor/Actor';
import { ConsumeApi } from '../../abilities/ConsumeApi';

export class IniciarSesion {
  static con(credenciales: unknown): Tarea {
    return async (actor: Actor) => {
      const api = actor.usar<ConsumeApi>(ConsumeApi.CLAVE);
      const inicio = Date.now();
      const respuesta = await api.post('/auth/login').send(credenciales);
      (respuesta as any).duration = Date.now() - inicio;
      return respuesta;
    };
  }
}
