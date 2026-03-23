import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { validate } from 'class-validator';
import { LoginDto } from '../auth/dto/login.dto';

// Mock de bcrypt
jest.mock('bcrypt');

describe('AuthService (Backend Tests)', () => {
  let authService: AuthService;
  let userService: Partial<UserService>;
  let jwtService: Partial<JwtService>;

  beforeEach(() => {
    // Arrange global (por defecto)
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

  // B-L01: DTO inválido es rechazado por el pipe de validación
  // Uso de Test Double: Dummy (LoginDto vacío)
  describe('B-L01', () => {
    it('DTO inválido es rechazado por el pipe de validación', async () => {
      // Arrange
      // Dummy: Objeto que se pasa pero no contiene los datos esperados, 
      // solo para disparar la validación y probar que falla.
      const dummyDto = new LoginDto(); 
      // No asignamos email ni contraseña para que falle
      
      // Act
      const errors = await validate(dummyDto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
    });
  });

  // B-L02: Email no registrado en la base de datos
  // Uso de Test Double: Stub (userService.findByEmail devuelve null)
  describe('B-L02', () => {
    it('Email no registrado en la base de datos', async () => {
      // Arrange
      const loginDto = { email: 'noexiste@test.com', password: '1234' };
      // Stub: devuelvo una respuesta preprogramada (null) para forzar la ruta de error
      (userService.findByEmail as jest.Mock).mockResolvedValue(null);

      // Act
      const act = authService.login(loginDto);
      
      // Assert
      await expect(act).rejects.toThrow(NotFoundException);
      await expect(act).rejects.toThrow('Correo o contraseña incorrectos');
    });
  });

  // B-L03: Email correcto pero contraseña incorrecta
  // Uso de Test Double: Fake (simulación de bcrypt.compare)
  describe('B-L03', () => {
    it('Email correcto pero contraseña incorrecta', async () => {
      // Arrange
      const loginDto = { email: 'valido@test.com', password: 'wrongpass' };
      const userFound = { id: '1', email: 'valido@test.com', password: 'hashedpassword' } as any;
      (userService.findByEmail as jest.Mock).mockResolvedValue(userFound);
      
      // Fake: Simulamos un comportamiento básico de comparar contraseñas (implementación ligera falsa)
      (bcrypt.compare as jest.Mock).mockImplementation((plain, hashed) => {
        return Promise.resolve(plain === 'correctpass'); // Solo retorna true si coincide con 'correctpass'
      });

      // Act
      const act = authService.login(loginDto);

      // Assert
      await expect(act).rejects.toThrow(NotFoundException);
      await expect(act).rejects.toThrow('Correo o contraseña incorrectos');
    });
  });

  // B-L04: Credenciales correctas genera JWT y retorna 200
  // Uso de Test Double: Mock (userService y jwtService configurados con expectativas)
  describe('B-L04', () => {
    it('Credenciales correctas genera JWT y retorna 200', async () => {
      // Arrange
      const loginDto = { email: 'valido@test.com', password: 'correctpass' };
      const userFound = { id: '1', email: 'valido@test.com', password: 'hashedpassword' } as any;
      
      // Mock: preparado con resolución exitosa
      const mockFindByEmail = jest.fn().mockResolvedValue(userFound);
      const mockSign = jest.fn().mockReturnValue('mocked-token');
      
      userService.findByEmail = mockFindByEmail;
      jwtService.sign = mockSign;
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await authService.login(loginDto);

      // Assert
      expect(mockFindByEmail).toHaveBeenCalledWith('valido@test.com');
      expect(mockSign).toHaveBeenCalled();
      expect(result).toEqual({ success: true, token: 'mocked-token' });
    });
  });

  // B-L05: El token generado contiene el payload correcto (sub, email)
  // Uso de Test Double: Spy (espiar la llamada a jwtService.sign)
  describe('B-L05', () => {
    it('El token generado contiene el payload correcto (sub, email)', async () => {
      // Arrange
      const loginDto = { email: 'valido@test.com', password: 'correctpass' };
      const userFound = { id: '1', email: 'valido@test.com', username: 'user', role: 'admin', avatar: 'url' } as any;
      
      (userService.findByEmail as jest.Mock).mockResolvedValue(userFound);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      
      // Spy: Espiamos la función original o el mock preexistente para ver cómo fue invocado
      const signSpy = jest.spyOn(jwtService, 'sign').mockReturnValue('token-generado');

      // Act
      await authService.login(loginDto);

      // Assert
      // Verificamos el payload que se pasa a jwtService.sign
      expect(signSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          email: 'valido@test.com'
        })
      );
    });
  });
});
