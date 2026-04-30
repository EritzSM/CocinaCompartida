import { Actor, Tarea } from '../../actor/Actor';
import { ConsumeApi } from '../../abilities/ConsumeApi';

/**
 * Task Screenplay: Crear un comentario en una receta.
 *
 * Uso fluido:
 *   PostComment.withMessage('Genial!').onRecipe(recipeId).authenticatedWith(token)
 */
export class PostComment {
  private _recipeId = '';
  private _token?: string;

  private constructor(private readonly message: string) {}

  /** Punto de entrada: PostComment.withMessage('texto') */
  static withMessage(message: string): PostComment {
    return new PostComment(message);
  }

  /** Especifica la receta donde se publica el comentario */
  onRecipe(recipeId: string): PostComment {
    this._recipeId = recipeId;
    return this;
  }

  /** Agrega el token JWT de autenticación */
  authenticatedWith(token: string): PostComment {
    this._token = token;
    return this;
  }

  /** Convierte la configuración en una Tarea ejecutable por un Actor */
  comoTarea(): Tarea {
    return async (actor: Actor) => {
      const api = actor.usar<ConsumeApi>(ConsumeApi.CLAVE);
      let peticion = api.post(`/recipes/${this._recipeId}/comments`);

      if (this._token) {
        peticion = peticion.set('Authorization', `Bearer ${this._token}`);
      }

      const inicio = Date.now();
      const respuesta = await peticion.send({ message: this.message });
      (respuesta as any).duration = Date.now() - inicio;
      return respuesta;
    };
  }
}
