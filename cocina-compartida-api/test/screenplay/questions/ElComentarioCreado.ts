/**
 * Question Screenplay: Validar la respuesta de un comentario creado.
 *
 * Extrae propiedades clave del body de respuesta para aserciones fluidas:
 *   const comentario = ElComentarioCreado.desde(respuesta);
 *   esperar(comentario.id).esteDefinido();
 *   esperar(comentario.message).seaIgualA('Genial!');
 */
export class ElComentarioCreado {
  readonly id: string;
  readonly message: string;
  readonly user: any;
  readonly createdAt: string;
  readonly status: number;
  readonly body: any;
  readonly duration: number;

  private constructor(respuesta: any) {
    this.status = respuesta.status;
    this.body = respuesta.body;
    this.duration = respuesta.duration ?? 0;
    this.id = respuesta.body?.id;
    this.message = respuesta.body?.message;
    this.user = respuesta.body?.user;
    this.createdAt = respuesta.body?.createdAt;
  }

  /** Extrae las propiedades clave de la respuesta HTTP */
  static desde(respuesta: any): ElComentarioCreado {
    return new ElComentarioCreado(respuesta);
  }

  /** Retorna el mensaje de error (para respuestas 4xx) */
  get errorMessage(): string {
    return this.body?.message ?? '';
  }

  /** Verifica si la operación fue exitosa (2xx) */
  get fueExitoso(): boolean {
    return this.status >= 200 && this.status < 300;
  }
}
