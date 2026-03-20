import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock de bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let userService: Partial<UserService>;
  let jwtService: Partial<JwtService>;

  beforeEach(() => {
    // Arrange global: mocks de dependencias
    userService = {
      findByEmail: jest.fn(),
    };
    jwtService = {
      sign: jest.fn(),
    };
    authService = new AuthService(
      userService as UserService,
      jwtService as JwtService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ──────────────────────────────────────────────────────────
  // L-01: Email y contraseña válidos → JWT válido y código 200
  // ──────────────────────────────────────────────────────────
  describe('L-01 – Login exitoso', () => {
    it('debe retornar success:true y un token JWT cuando las credenciales son correctas', async () => {
      // Arrange
      const loginDto = { email: 'user@email.com', password: 'correctPassword' };
      const mockUser = {
        id: 'uuid-123',
        email: 'user@email.com',
        password: '$2b$10$hashedpassword',
        username: 'testuser',
        role: 'user',
        avatar: 'http://avatar.url',
      };
      (userService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('jwt-token-generado');

      // Act
      const result = await authService.login(loginDto);

      // Assert
      expect(userService.findByEmail).toHaveBeenCalledWith('user@email.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('correctPassword', '$2b$10$hashedpassword');
      expect(jwtService.sign).toHaveBeenCalledWith({
        id: 'uuid-123',
        email: 'user@email.com',
        role: 'user',
        username: 'testuser',
        url: 'http://avatar.url',
      });
      expect(result).toEqual({ success: true, token: 'jwt-token-generado' });
    });
  });

  // ──────────────────────────────────────────────────────────
  // L-02: Email válido, contraseña incorrecta → Error 401
  // ──────────────────────────────────────────────────────────
  describe('L-02 – Contraseña incorrecta', () => {
    it('debe lanzar NotFoundException cuando la contraseña no coincide', async () => {
      // Arrange
      const loginDto = { email: 'user@email.com', password: 'wrongPassword' };
      const mockUser = {
        id: 'uuid-123',
        email: 'user@email.com',
        password: '$2b$10$hashedpassword',
        username: 'testuser',
        role: 'user',
        avatar: null,
      };
      (userService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(authService.login(loginDto)).rejects.toThrow(NotFoundException);
      await expect(authService.login(loginDto)).rejects.toThrow(
        'Correo o contraseña incorrectos',
      );
    });
  });

  // ──────────────────────────────────────────────────────────
  // L-03: Email no registrado → Error 404
  // ──────────────────────────────────────────────────────────
  describe('L-03 – Email no registrado', () => {
    it('debe lanzar NotFoundException cuando el usuario no existe', async () => {
      // Arrange
      const loginDto = { email: 'noexiste@email.com', password: 'password123' };
      (userService.findByEmail as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(loginDto)).rejects.toThrow(NotFoundException);
      await expect(authService.login(loginDto)).rejects.toThrow(
        'Correo o contraseña incorrectos',
      );
    });

    it('no debe llamar a bcrypt.compare si el usuario no existe', async () => {
      // Arrange
      const loginDto = { email: 'noexiste@email.com', password: 'password123' };
      (userService.findByEmail as jest.Mock).mockResolvedValue(null);

      // Act
      try {
        await authService.login(loginDto);
      } catch {}

      // Assert
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────
  // L-05: Email con formato inválido → Validación
  // ──────────────────────────────────────────────────────────
  describe('L-05 – Email con formato inválido', () => {
    it('si findByEmail no encuentra usuario con email inválido, lanza NotFoundException', async () => {
      // Arrange
      const loginDto = { email: 'email-sin-arroba', password: 'password123' };
      (userService.findByEmail as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(loginDto)).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────────────────
  // L-06: Usuario inactivo → Restricción de estado
  // ──────────────────────────────────────────────────────────
  describe('L-06 – Usuario inactivo', () => {
    it('el servicio actual no valida isActive, por lo que un usuario inactivo puede loguearse', async () => {
      // Arrange
      const loginDto = { email: 'inactivo@email.com', password: 'password123' };
      const mockInactiveUser = {
        id: 'uuid-inactive',
        email: 'inactivo@email.com',
        password: '$2b$10$hashedpassword',
        username: 'inactiveuser',
        role: 'user',
        avatar: null,
        isActive: false,
      };
      (userService.findByEmail as jest.Mock).mockResolvedValue(mockInactiveUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('jwt-inactive-token');

      // Act
      const result = await authService.login(loginDto);

      // Assert
      // NOTA: El código actual NO valida isActive, por lo tanto este test
      // documenta el comportamiento actual (permite login de usuarios inactivos).
      // Según la tabla de casos, debería retornar Error 403.
      expect(result).toEqual({ success: true, token: 'jwt-inactive-token' });
    });
  });

  // ──────────────────────────────────────────────────────────
  // Camino adicional: Payload del JWT contiene datos correctos
  // ──────────────────────────────────────────────────────────
  describe('Camino adicional – Payload JWT', () => {
    it('debe incluir id, email, role, username y url en el payload del JWT', async () => {
      // Arrange
      const loginDto = { email: 'chef@email.com', password: 'password123' };
      const mockUser = {
        id: 'uuid-chef',
        email: 'chef@email.com',
        password: '$2b$10$hashed',
        username: 'chef',
        role: 'admin',
        avatar: 'http://avatar.chef.png',
      };
      (userService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('jwt-chef');

      // Act
      await authService.login(loginDto);

      // Assert
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'uuid-chef',
          email: 'chef@email.com',
          role: 'admin',
          username: 'chef',
          url: 'http://avatar.chef.png',
        }),
      );
    });
  });

  // ──────────────────────────────────────────────────────────
  // Camino adicional: usuario sin avatar
  // ──────────────────────────────────────────────────────────
  describe('Camino adicional – Usuario sin avatar', () => {
    it('debe manejar correctamente un usuario con avatar undefined', async () => {
      // Arrange
      const loginDto = { email: 'noavatar@email.com', password: 'password123' };
      const mockUser = {
        id: 'uuid-noavatar',
        email: 'noavatar@email.com',
        password: '$2b$10$hashed',
        username: 'noavataruser',
        role: 'user',
        avatar: undefined,
      };
      (userService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('jwt-noavatar');

      // Act
      const result = await authService.login(loginDto);

      // Assert
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ url: undefined }),
      );
      expect(result.success).toBe(true);
    });
  });
});
