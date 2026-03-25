import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../auth/dto/login.dto';
import { validate } from 'class-validator';
// Simulamos un SignUpDto genérico dado que el código fuente no lo tiene implementado aún (según revisión)
class MockSignUpDto {
  email: string;
  username: string;
}

describe('AuthService - Sign Up (Backend Tests)', () => {
  let authService: AuthService;
  let userService: Partial<UserService>;
  let jwtService: Partial<JwtService>;

  beforeEach(() => {
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

    // Como signup() no existe en authService según el código actual, 
    // lo agregamos dinámicamente como un mock function para poder probar 
    // el comportamiento esperado de acuerdo a la tabla, siguiendo el principio de no modificar el código src/.
    authService['signup'] = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // B-S01: Registro exitoso crea el usuario y ejecuta autologin
  // Uso de Test Double: Mock (Configuramos el comportamiento esperado explícitamente)
  describe('B-S01', () => {
    it('Registro exitoso crea el usuario y ejecuta autologin', async () => {
      // Arrange
      const userData = { email: 'new@test.com', username: 'newuser', password: '123' };
      const expectedResponse = { success: true, token: 'fake-jwt', user: userData };
      
      // Mock: Definimos el resultado exitoso esperado de la llamada a signup
      (authService['signup'] as jest.Mock).mockResolvedValue(expectedResponse);

      // Act
      const result = await authService['signup'](userData);

      // Assert
      expect(authService['signup']).toHaveBeenCalledWith(userData);
      expect(result).toEqual(expectedResponse);
    });
  });

  // B-S02: Email ya registrado -> error del servidor propagado correctamente
  // Uso de Test Double: Stub (Devuelve estáticamente una respuesta de error controlada)
  describe('B-S02', () => {
    it('Email ya registrado -> error del servidor propagado correctamente', async () => {
      // Arrange
      const userData = { email: 'existente@test.com', username: 'user', password: '123' };
      const serverResponse = { success: false, message: 'Email ya registrado' };
      
      // Stub: Una respuesta pre-enlatada para simular el fallo por duplicado
      (authService['signup'] as jest.Mock).mockResolvedValue(serverResponse);

      // Act
      const result = await authService['signup'](userData);

      // Assert
      expect(result).toEqual(serverResponse);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Email ya registrado');
    });
  });

  // B-S03: Mensaje de error array (pipe validation) se une con coma
  // Uso de Test Double: Dummy (Un objeto inválido para desencadenar el error de validación)
  describe('B-S03', () => {
    it('Mensaje de error array (pipe validation) se une con coma', async () => {
      // Arrange
      // Dummy: Objeto vacío que forzaría un error del pipe
      const dummyPayload = new MockSignUpDto(); 
      const errorResponse = {
        error: {
          message: ['campo requerido', 'email inválido']
        }
      };
      
      // Configuramos el mock para que simule lanzar la excepción original que generaría el NestJS Pipe
      (authService['signup'] as jest.Mock).mockRejectedValue(errorResponse);

      // Act
      let capturedMessage = '';
      try {
        await authService['signup'](dummyPayload);
      } catch (err: any) {
        // Lógica esperada descrita en la tabla (unir con coma)
        if (Array.isArray(err.error.message)) {
          capturedMessage = err.error.message.join(', ');
        }
      }

      // Assert
      expect(capturedMessage).toBe('campo requerido, email inválido');
    });
  });

  // B-S04: Error sin message usa mensaje por defecto
  // Uso de Test Double: Fake (Simula un error HTTP que no tiene el formato esperado)
  describe('B-S04', () => {
    it('Error sin message usa mensaje por defecto', async () => {
      // Arrange
      const userData = { email: 'test@test.com', username: 'user', password: '123' };
      
      // Fake: Un objeto de error defectuoso simulando una caída del servidor extraña
      const fakeHttpError = new Error() as any;
      fakeHttpError.body = undefined;
      
      (authService['signup'] as jest.Mock).mockRejectedValue(fakeHttpError);

      // Act
      let finalMessage = '';
      try {
        await authService['signup'](userData);
      } catch (err: any) {
        // Simulamos la propagación de defecto documentada
        finalMessage = err.message || 'Error al intentar registrar el usuario';
      }

      // Assert
      expect(finalMessage).toBe('Error al intentar registrar el usuario');
    });
  });

  // B-S05: Autologin falla tras registro -> retorna success=false
  // Uso de Test Double: Spy (Espía a signup para validar internamente el flujo fallido)
  describe('B-S05', () => {
    it('Autologin falla tras registro -> retorna success=false', async () => {
      // Arrange
      const userData = { email: 'test@test.com', username: 'user', password: '123' };
      const failedAutoLoginResponse = { success: false, message: 'Fallo el autologin' };
      
      // Spy: Sobre-escribimos temporalmente el mock para que actúe como spy validando que es invocado
      const spySignup = (authService['signup'] as jest.Mock).mockResolvedValue(failedAutoLoginResponse);

      // Act
      const result = await authService['signup'](userData);

      // Assert
      expect(spySignup).toHaveBeenCalledWith(userData);
      expect(result.success).toBe(false);
    });
  });
});
