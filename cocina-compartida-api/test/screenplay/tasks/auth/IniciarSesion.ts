import { Actor } from '../../actor/Actor';
import { ConsumeApi } from '../../abilities/ConsumeApi';

export interface CredencialesLogin {
  email: string;
  password: string;
}

/**
 * Patrón Screenplay — Task: IniciarSesion
 *
 * Tarea de alto nivel que encapsula el flujo de autenticación
 * (/auth/login POST) y devuelve el token JWT resultante.
 */
export class IniciarSesion {
  private constructor(private readonly credenciales: CredencialesLogin) {}

  static con(credenciales: CredencialesLogin): (actor: Actor) => Promise<{ status: number; body: any; token: string }> {
    const tarea = new IniciarSesion(credenciales);
    return (actor: Actor) => tarea.ejecutarCon(actor);
  }

  private async ejecutarCon(actor: Actor) {
    const api = actor.usar<ConsumeApi>(ConsumeApi.CLAVE);
    const response = await api.post('/auth/login').send(this.credenciales);
    return {
      status: response.status,
      body: response.body,
      token: response.body?.token ?? '',
    };
  }
}
