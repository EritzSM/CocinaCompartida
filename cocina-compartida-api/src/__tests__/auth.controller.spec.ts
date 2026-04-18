import { AuthController } from '../auth/auth.controller';
import { AuthService } from '../auth/auth.service';
import { BadRequestException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: Partial<AuthService>;

  beforeEach(() => {
    // Arrange global: mock del AuthService
    authService = {
      login: jest.fn(),
    };
    controller = new AuthController(authService as AuthService);
  });

  // ──────────────────────────────────────────────────────────
  // L-04: Campos vacíos → Error 400
  // ──────────────────────────────────────────────────────────
  describe('L-04 – Campos vacíos', () => {
    it('debe lanzar BadRequestException si email y password están vacíos', () => {
      // Test Double: Dummy – dto vacío sin comportamiento
      // Arrange
      const dto = { email: '', password: '' };

      // Act & Assert
      expect(() => controller.login(dto)).toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException si email está vacío', () => {
      // Test Double: Dummy – dto vacío sin comportamiento
      // Arrange
      const dto = { email: '', password: 'password123' };

      // Act & Assert
      expect(() => controller.login(dto)).toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException si password está vacío', () => {
      // Test Double: Dummy – dto vacío sin comportamiento
      // Arrange
      const dto = { email: 'test@email.com', password: '' };

      // Act & Assert
      expect(() => controller.login(dto)).toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException si email es undefined', () => {
      // Test Double: Dummy – dto vacío sin comportamiento
      // Arrange
      const dto = { email: undefined, password: 'password123' } as any;

      // Act & Assert
      expect(() => controller.login(dto)).toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException si password es undefined', () => {
      // Test Double: Dummy – dto vacío sin comportamiento
      // Arrange
      const dto = { email: 'test@email.com', password: undefined } as any;

      // Act & Assert
      expect(() => controller.login(dto)).toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException si email es null', () => {
      // Test Double: Dummy – dto vacío sin comportamiento
      // Arrange
      const dto = { email: null, password: 'password123' } as any;

      // Act & Assert
      expect(() => controller.login(dto)).toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException si password es null', () => {
      // Test Double: Dummy – dto vacío sin comportamiento
      // Arrange
      const dto = { email: 'test@email.com', password: null } as any;

      // Act & Assert
      expect(() => controller.login(dto)).toThrow(BadRequestException);
    });
  });

  // ──────────────────────────────────────────────────────────
  // L-01: Email y contraseña válidos → delega al servicio
  // ──────────────────────────────────────────────────────────
  describe('L-01 – Email y contraseña válidos', () => {
    it('debe llamar a authService.login con el dto correcto y retornar JWT', async () => {
      // Test Double: Mock – mockResolvedValue + toHaveBeenCalledWith verifica la llamada
      // Arrange
      const dto = { email: 'user@email.com', password: 'correctPassword' };
      const expectedResult = { success: true, token: 'jwt-token-mock' };
      (authService.login as jest.Mock).mockResolvedValue(expectedResult);

      // Act
      const result = await controller.login(dto);

      // Assert
      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  // ──────────────────────────────────────────────────────────
  // L-02/L-03: Errores del servicio se propagan al controller
  // ──────────────────────────────────────────────────────────
  describe('L-02/L-03 – Errores del servicio se propagan', () => {
    it('debe propagar la excepción si authService.login lanza error', async () => {
      // Test Double: Stub – solo pre-programa error, no verifica args
      // Arrange
      const dto = { email: 'user@email.com', password: 'wrongPassword' };
      (authService.login as jest.Mock).mockRejectedValue(
        new Error('Correo o contraseña incorrectos'),
      );

      // Act & Assert
      await expect(controller.login(dto)).rejects.toThrow(
        'Correo o contraseña incorrectos',
      );
    });
  });
});
