import { Actor } from '../../actor/Actor';
import { ConsumeApi } from '../../abilities/ConsumeApi';

export interface DatosRegistro {
  username: string;
  email: string;
  password: string;
}

/**
 * Patrón Screenplay — Task: RegistrarCuenta
 *
 * Tarea de alto nivel que encapsula el flujo completo
 * de registrar un nuevo usuario en la API (/users POST).
 */
export class RegistrarCuenta {
  private constructor(private readonly datos: DatosRegistro) {}

  static con(datos: DatosRegistro): (actor: Actor) => Promise<{ status: number; body: any }> {
    const tarea = new RegistrarCuenta(datos);
    return (actor: Actor) => tarea.ejecutarCon(actor);
  }

  private async ejecutarCon(actor: Actor) {
    const api = actor.usar<ConsumeApi>(ConsumeApi.CLAVE);
    const response = await api.post('/users').send(this.datos);
    return { status: response.status, body: response.body };
  }
}
