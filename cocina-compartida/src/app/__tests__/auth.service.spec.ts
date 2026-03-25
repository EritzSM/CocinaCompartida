import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { Auth } from '../shared/services/auth';

describe('Frontend - AuthService (Login y Registro)', () => {
  let service: Auth;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    // Patrón AAA - Arrange global
    // Test Double (Spy): Espiamos las llamadas al Router
    const rSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        Auth,
        { provide: Router, useValue: rSpy }
      ]
    });

    service = TestBed.inject(Auth);
    httpMock = TestBed.inject(HttpTestingController);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Test Double (Fake): Sustituimos localStorage para que las pruebas corran en memoria sin ensuciar variables globales
    let store: { [key: string]: string } = {};
    spyOn(localStorage, 'getItem').and.callFake((key: string) => store[key] || null);
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => store[key] = value);
    spyOn(localStorage, 'removeItem').and.callFake((key: string) => delete store[key]);
  });

  afterEach(() => {
    httpMock.verify(); // Verifica que no haya peticiones http pendientes
  });

  // ──────────────────────────────────────────────────────────
  // L-01: Email y contraseña válidos → Login exitoso
  // ──────────────────────────────────────────────────────────
  describe('L-01 – Login exitoso con Mock Http', () => {
    it('debe enviar request POST, persistir token y navegar a /home', async () => {
      // Arrange
      const credentials = { email: 'user@test.com', password: 'correctpass' };
      // Test Double (Dummy): Payload de respuesta exitosa
      const mockResponse = {
        success: true,
        token: 'header.payload-generico.signature',
        user: { id: 'uuid-1', username: 'testuser', email: 'user@test.com' }
      };

      // Act
      const loginPromise = service.login(credentials);

      // Test Double (Mock): Interceptores de http para simular llamada real del backend
      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse); // Disparamos la respuesta simulada

      const result = await loginPromise;

      // Assert
      expect(result.success).toBeTrue();
      expect(result.token).toBe('header.payload-generico.signature');
      // Test Double (Spy): Verificamos que el spy del router fue llamado
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/home'], { replaceUrl: true });
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'header.payload-generico.signature');
      expect(service.isLoged()).toBeTrue();
      expect(service.currentUser()?.id).toBe('uuid-1');
    });
  });

  // ──────────────────────────────────────────────────────────
  // L-02 / L-03: Errores en login
  // ──────────────────────────────────────────────────────────
  describe('L-02 / L-03 – Email/Password incorrecto (Test Doubles Http Stub)', () => {
    it('debe manejar error del servidor y retornar success: false', async () => {
      // Arrange
      const credentials = { email: 'user@test.com', password: 'wrongpass' };
      
      // Act
      const loginPromise = service.login(credentials);

      // Test Double (Stub): Forzamos un 401 Unauthorized explícito del backend
      const req = httpMock.expectOne('/api/auth/login');
      req.flush({ message: 'Credenciales incorrectas' }, { status: 401, statusText: 'Unauthorized' });

      const result = await loginPromise;

      // Assert
      expect(result.success).toBeFalse();
      expect(result.message).toContain('Credenciales incorrectas');
      expect(routerSpy.navigate).not.toHaveBeenCalled();
      expect(service.isLoged()).toBeFalse();
    });
  });

  // ──────────────────────────────────────────────────────────
  // L-04/L-05: Validación y errores de estructura
  // ──────────────────────────────────────────────────────────
  describe('L-04/L-05 – Errores de validación', () => {
    it('debe manejar error 400 por validación de campos vacíos', async () => {
      // Arrange
      const credentials = { email: '', password: '' };

      // Act
      const loginPromise = service.login(credentials);

      // Test Double (Stub): 400 Bad Request
      const req = httpMock.expectOne('/api/auth/login');
      req.flush({ message: ['Debe ingresar email'] }, { status: 400, statusText: 'Bad Request' });

      const result = await loginPromise;

      // Assert
      expect(result.success).toBeFalse();
      expect(result.message).toContain('Debe ingresar email'); // Extrajo del array de error
    });
  });

  // ──────────────────────────────────────────────────────────
  // Registro: R-01 a R-05
  // ──────────────────────────────────────────────────────────
  describe('R-01 a R-05 – Método signup() y autologin', () => {
    it('debe crear usuario y luego auto-loguearse (Mock y Spies anidados)', async () => {
      // Arrange
      // Test Double (Dummy): Objeto de usuario temporal (no necesitamos id aquí)
      const userData = { username: 'newuser', email: 'new@test.com', password: '123' };
      const signupResponse = { id: 'uuid-new', username: 'newuser' };
      const loginMockResponse = { success: true, token: 'mock-token', user: signupResponse };

      // Act
      const signupPromise = service.signup(userData);

      // Test Double (Mock): Primer request (Creación)
      const reqSignup = httpMock.expectOne('/api/users');
      expect(reqSignup.request.method).toBe('POST');
      reqSignup.flush(signupResponse);

      // Test Double (Mock): Al responder Signup exitoso, el servicio llama a Login. Interceptamos:
      const reqLogin = httpMock.expectOne('/api/auth/login');
      expect(reqLogin.request.method).toBe('POST');
      expect(reqLogin.request.body).toEqual({ email: 'new@test.com', password: '123' });
      reqLogin.flush(loginMockResponse);

      const result = await signupPromise;

      // Assert
      expect(result.success).toBeTrue();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/home'], { replaceUrl: true });
      expect(service.isLoged()).toBeTrue();
    });

    it('debe manejar error en el registro (email duplicado, etc)', async () => {
      // Arrange
      const userData = { username: 'duplicado', email: 'dup@test.com', password: '123' };

      // Act
      const signupPromise = service.signup(userData);

      // Test Double (Stub): Error 409 o 400 en creación
      const reqSignup = httpMock.expectOne('/api/users');
      reqSignup.flush({ message: 'El correo ya está en uso' }, { status: 409, statusText: 'Conflict' });

      const result = await signupPromise;

      // Assert
      expect(result.success).toBeFalse();
      expect(result.message).toContain('El correo ya está en uso');
      // No debería haber request de login
      httpMock.expectNone('/api/auth/login');
    });
  });
});
