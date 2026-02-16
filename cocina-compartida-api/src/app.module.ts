import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RecipesModule } from './recipes/recipes.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'cocina',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production', // ✅ true en development
      ssl: process.env.DB_SSL === 'true' 
        ? { rejectUnauthorized: false }
        : false,
      logging: ['error', 'warn', 'schema'], // ✅ Ver las queries de creación
      extra: {
        max: 10,
        connectionTimeoutMillis: 5000,
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    UserModule,
    AuthModule,
    RecipesModule,
    UploadsModule,
  ],
})
export class AppModule {}