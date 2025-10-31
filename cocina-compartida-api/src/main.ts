// src/main.ts (Backend NestJS)

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ CORRECCIÓN: Habilitar CORS ANTES de que el servidor escuche
  app.enableCors({
    origin: 'http://localhost:4200', // Origen de tu aplicación Angular
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', 
    credentials: true, 
  });

  await app.listen(process.env.PORT ?? 3000); // ⬅️ Ahora el servidor escucha con CORS habilitado
}
bootstrap();