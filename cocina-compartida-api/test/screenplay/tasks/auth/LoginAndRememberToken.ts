import { Actor, Tarea } from '../../actor/Actor';
import { ConsumeApi } from '../../abilities/ConsumeApi';

/**
 * Task Screenplay: Iniciar sesión y recordar el token JWT.
 *
 * Uso: LoginAndRememberToken.withCredentials({ email, password })
 *
 * Después de ejecutar, el token queda disponible en:
 *   actor.usar<{ token: string }>('notas').token
 */
export class LoginAndRememberToken {
  private constructor(private readonly credentials: { email: string; password: string }) {}

  static withCredentials(credentials: { email: string; password: string }): LoginAndRememberToken {
    return new LoginAndRememberToken(credentials);
  }

  comoTarea(): Tarea {
    return async (actor: Actor) => {
      const api = actor.usar<ConsumeApi>(ConsumeApi.CLAVE);
      const inicio = Date.now();
      const respuesta = await api.post('/auth/login').send(this.credentials);
      (respuesta as any).duration = Date.now() - inicio;

      // Guardar el token en las notas del actor
      const token = respuesta.body?.token;
      if (token) {
        // Almacenar como habilidad accesible
        actor.con({ clave: 'jwt', token } as any);
      }

      return respuesta;
    };
  }
}
