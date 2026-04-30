export class LaRespuesta {
  static statusDe(respuesta: any): number {
    return respuesta.status;
  }

  static cuerpoDe(respuesta: any): any {
    return respuesta.body;
  }

  static tokenDe(respuesta: any): string {
    return respuesta.body?.token;
  }

  static duracionDe(respuesta: any): number {
    return respuesta.duration ?? respuesta.duracion ?? 0;
  }
}
