import { INestApplication } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const supertest = require('supertest');

/**
 * Patrón Screenplay — Ability: ConsumeApi
 *
 * Encapsula la capacidad de un Actor de hacer peticiones HTTP
 * al servidor de la aplicación NestJS mediante Supertest.
 */
export class ConsumeApi {
  static readonly CLAVE = 'ConsumeApi';

  private readonly agente: ReturnType<typeof supertest>;

  private constructor(app: INestApplication) {
    this.agente = supertest(app.getHttpServer());
  }

  /** Crea la habilidad lista para ser entregada al Actor con .con(...) */
  static usando(app: INestApplication): { clave: string; instancia: ConsumeApi } {
    return { clave: ConsumeApi.CLAVE, instancia: new ConsumeApi(app) };
  }

  /** Realiza una petición GET */
  get(endpoint: string) {
    return this.agente.get(endpoint);
  }

  /** Realiza una petición POST */
  post(endpoint: string) {
    return this.agente.post(endpoint);
  }

  /** Realiza una petición PATCH */
  patch(endpoint: string) {
    return this.agente.patch(endpoint);
  }

  /** Realiza una petición DELETE */
  delete(endpoint: string) {
    return this.agente.delete(endpoint);
  }
}
