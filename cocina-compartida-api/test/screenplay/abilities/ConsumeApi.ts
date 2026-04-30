import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export class ConsumeApi {
  static readonly CLAVE = 'ConsumeApi';
  readonly clave = ConsumeApi.CLAVE;

  private constructor(private readonly app: INestApplication) {}

  static usando(app: INestApplication): ConsumeApi {
    return new ConsumeApi(app);
  }

  get(path: string) {
    return request(this.app.getHttpServer()).get(path);
  }

  post(path: string) {
    return request(this.app.getHttpServer()).post(path);
  }

  patch(path: string) {
    return request(this.app.getHttpServer()).patch(path);
  }

  delete(path: string) {
    return request(this.app.getHttpServer()).delete(path);
  }
}
