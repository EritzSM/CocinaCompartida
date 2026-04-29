import { Actor } from '../../actor/Actor';
import { ConsumeApi } from '../../abilities/ConsumeApi';

export interface DatosReceta {
  name: string;
  descripcion: string;
  ingredients: string[];
  steps: string[];
  category?: string;
}

/**
 * Patrón Screenplay — Task: CrearReceta
 *
 * Tarea de alto nivel que encapsula la creación de una receta
 * (/recipes POST) con o sin token de autenticación.
 */
export class CrearReceta {
  private token: string | null = null;

  private constructor(private readonly datos: DatosReceta) {}

  static con(datos: DatosReceta): CrearReceta {
    return new CrearReceta(datos);
  }

  /** Indica que la petición debe incluir el Authorization header */
  autenticadoCon(token: string): CrearReceta {
    this.token = token;
    return this;
  }

  /** Convierte la Task en un callable para actor.intentar(...) */
  comoTarea(): (actor: Actor) => Promise<{ status: number; body: any }> {
    return (actor: Actor) => this.ejecutarCon(actor);
  }

  private async ejecutarCon(actor: Actor) {
    const api = actor.usar<ConsumeApi>(ConsumeApi.CLAVE);
    let req = api.post('/recipes').send(this.datos);
    if (this.token) {
      req = req.set('Authorization', `Bearer ${this.token}`);
    }
    const response = await req;
    return { status: response.status, body: response.body };
  }
}
