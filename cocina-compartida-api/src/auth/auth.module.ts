// src/auth/auth.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
// Si ya haces forRoot en AppModule, puedes quitar esta línea:
// import { ConfigModule } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [
    // Si ConfigModule.forRoot() ya está en AppModule, quítalo de aquí
    // ConfigModule.forRoot(),

    // Evita el ciclo Auth <-> User
    forwardRef(() => UserModule),

    // Puedes mantener global si quieres inyectar JwtService en todos lados
    JwtModule.register({
      global: true,
      secret: 'saefaHJgYgjvm',
      signOptions: { expiresIn: '2h' },
    }),
  ],
  exports: [
    AuthService,      // <- otros módulos lo usan
    JwtModule,        // <- si otros usan JwtService directamente
  ],
})
export class AuthModule {}
