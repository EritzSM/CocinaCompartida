/**
 * Patrón Screenplay — Question: LaRespuesta
 *
 * Proporciona extractores nombrados para los campos más comunes
 * de una respuesta HTTP, de forma que el código de prueba pueda
 * leer como lenguaje natural:
 *
 *   LaRespuesta.statusDe(res)        → número de status HTTP
 *   LaRespuesta.cuerpoDe(res)        → body completo
 *   LaRespuesta.tokenDe(res)         → token JWT del body
 *   LaRespuesta.duracionDe(res)      → milisegundos tardados
 */

export interface RespuestaHttp {
  status: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
  duracionMs?: number;
  token?: string;
}

export class LaRespuesta {
  /** Extrae el código HTTP de la respuesta */
  static statusDe(respuesta: RespuestaHttp): number {
    return respuesta.status;
  }

  /** Extrae el body completo de la respuesta */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static cuerpoDe(respuesta: RespuestaHttp): any {
    return respuesta.body;
  }

  /** Extrae el token JWT cuando existe */
  static tokenDe(respuesta: RespuestaHttp): string {
    return respuesta.token ?? respuesta.body?.token ?? '';
  }

  /** Extrae el tiempo de respuesta en ms (si fue medido) */
  static duracionDe(respuesta: RespuestaHttp): number {
    if (respuesta.duracionMs === undefined) {
      throw new Error(
        '[LaRespuesta] duracionMs no fue medido en esta respuesta. ' +
          'Usa ListarRecetas.ahora() o una tarea que mida el tiempo.',
      );
    }
    return respuesta.duracionMs;
  }
}
