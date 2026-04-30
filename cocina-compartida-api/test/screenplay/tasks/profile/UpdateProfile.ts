import { Actor, Tarea } from '../../actor/Actor';
import { ConsumeApi } from '../../abilities/ConsumeApi';

/**
 * Task Screenplay: Actualizar perfil de usuario.
 *
 * Uso: UpdateProfile.withData({ username: 'nuevo' }).authenticatedWith(token)
 */
export class UpdateProfile {
  private _token?: string;

  private constructor(private readonly data: Record<string, unknown>) {}

  static withData(data: Record<string, unknown>): UpdateProfile {
    return new UpdateProfile(data);
  }

  authenticatedWith(token: string): UpdateProfile {
    this._token = token;
    return this;
  }

  comoTarea(): Tarea {
    return async (actor: Actor) => {
      const api = actor.usar<ConsumeApi>(ConsumeApi.CLAVE);
      let peticion = api.patch('/users');

      if (this._token) {
        peticion = peticion.set('Authorization', `Bearer ${this._token}`);
      }

      const inicio = Date.now();
      const respuesta = await peticion.send(this.data);
      (respuesta as any).duration = Date.now() - inicio;
      return respuesta;
    };
  }
}
