import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Auth } from '../shared/services/auth';
import { Router } from '@angular/router';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  AUTH SERVICE – Pruebas Unitarias complementarias (Patrón AAA)
//  Funcionalidad: Utilidades JWT, verificación, logout, getters
//
//  Tipos de Mocks: Spy (localStorage), Stub (token), Dummy (JWT)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Helper: genera un JWT con payload dado
function makeJwt(payload: any): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

describe('Auth Service – Pruebas complementarias', () => {
  let service: Auth;
  let mockRouter: any;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    // Limpiar localStorage antes de cada test
    localStorage.clear();

    mockRouter = { navigate: jasmine.createSpy('navigate') };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        Auth,
        { provide: Router, useValue: mockRouter }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(Auth);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  // ──────────── AU-01 a AU-04: verifyLoggedUser ────────────
  describe('verifyLoggedUser', () => {
    it('AU-01: sin token hace logout sin redirect (Stub)', async () => {
      // Arrange
      localStorage.removeItem('token');

      // Act
      await service.verifyLoggedUser();

      // Assert
      expect(service.isLoged()).toBeFalse();
      expect(service.currentUser()).toBeNull();
    });

    it('AU-02: con token válido establece usuario (Dummy JWT)', async () => {
      // Arrange
      const token = makeJwt({
        sub: 'user-123',
        username: 'testchef',
        email: 'test@example.com',
        url: 'avatar.jpg',
        exp: Math.floor(Date.now() / 1000) + 3600 // expira en 1 hora
      });
      localStorage.setItem('token', token);

      // Act
      await service.verifyLoggedUser();

      // Assert
      expect(service.isLoged()).toBeTrue();
      expect(service.currentUsername()).toBe('testchef');
      expect(service.currentUser()?.id).toBe('user-123');
    });

    it('AU-03: con token expirado hace logout (Stub)', async () => {
      // Arrange
      const token = makeJwt({
        sub: 'u1', username: 'old',
        exp: Math.floor(Date.now() / 1000) - 3600 // expiró hace 1 hora
      });
      localStorage.setItem('token', token);

      // Act
      await service.verifyLoggedUser();

      // Assert
      expect(service.isLoged()).toBeFalse();
    });

    it('AU-04: con token sin sub ni id hace logout (Stub)', async () => {
      // Arrange
      const token = makeJwt({
        username: 'noId',
        exp: Math.floor(Date.now() / 1000) + 3600
      });
      localStorage.setItem('token', token);

      // Act
      await service.verifyLoggedUser();

      // Assert
      expect(service.isLoged()).toBeFalse();
    });
  });

  // ──────────── AU-05 a AU-06: logout ────────────
  describe('logout', () => {
    it('AU-05: logout con redirect navega a /login (Spy)', () => {
      // Arrange
      localStorage.setItem('token', 'test');

      // Act
      service.logout(true);

      // Assert
      expect(localStorage.getItem('token')).toBeNull();
      expect(service.isLoged()).toBeFalse();
      expect(service.currentUser()).toBeNull();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('AU-06: logout sin redirect no navega (Spy)', () => {
      // Act
      service.logout(false);

      // Assert
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  // ──────────── AU-07 a AU-10: getters ────────────
  describe('Getters', () => {
    it('AU-07: isAuthenticated refleja isLoged (Stub)', () => {
      // Arrange
      service.isLoged.set(true);

      // Assert
      expect(service.isAuthenticated()).toBeTrue();
    });

    it('AU-08: getCurrentUser retorna currentUser signal (Stub)', () => {
      // Arrange
      const user = { id: 'u1', username: 'test', email: '', password: '', bio: '' } as any;
      service.currentUser.set(user);

      // Assert
      expect(service.getCurrentUser()?.id).toBe('u1');
    });

    it('AU-09: getUserId retorna id del currentUser', () => {
      // Arrange
      service.currentUser.set({ id: 'u99', username: 'x', email: '', password: '' } as any);

      // Assert
      expect(service.getUserId()).toBe('u99');
    });

    it('AU-10: getUserId retorna undefined si no hay usuario', () => {
      // Arrange
      service.currentUser.set(null);

      // Assert
      expect(service.getUserId()).toBeUndefined();
    });

    it('AU-11: currentAvatar retorna avatar del usuario (Stub)', () => {
      // Arrange
      service.currentUser.set({ id: 'u1', username: 'x', email: '', password: '', avatar: 'my-avatar.jpg' } as any);

      // Assert
      expect(service.currentAvatar()).toBe('my-avatar.jpg');
    });

    it('AU-12: currentAvatar retorna default si no hay avatar', () => {
      // Arrange
      service.currentUser.set(null);

      // Assert
      expect(service.currentAvatar()).toBe('assets/logos/default-avatar.png');
    });

    it('AU-13: getUserProfile retorna lo mismo que getCurrentUser', () => {
      // Arrange
      const user = { id: 'u1', username: 'test' } as any;
      service.currentUser.set(user);

      // Assert
      expect(service.getUserProfile()).toBe(service.getCurrentUser());
    });
  });

  // ──────────── AU-14: login error handling ────────────
  describe('login', () => {
    it('AU-14: login exitoso persiste token y navega a /home (Mock HTTP)', async () => {
      // Arrange
      const token = makeJwt({ sub: 'u1', username: 'chef', email: 'c@c.com', exp: Math.floor(Date.now() / 1000) + 3600 });

      // Act
      const promise = service.login({ email: 'c@c.com', password: '123' });
      const req = httpMock.expectOne('/api/auth/login');
      req.flush({ success: true, token, user: { id: 'u1', username: 'chef', email: 'c@c.com' } });
      const result = await promise;

      // Assert
      expect(result.success).toBeTrue();
      expect(service.isLoged()).toBeTrue();
      expect(localStorage.getItem('token')).toBe(token);
    });

    it('AU-15: login fallido retorna error message (Stub error)', async () => {
      // Act
      const promise = service.login({ email: 'bad', password: 'x' });
      const req = httpMock.expectOne('/api/auth/login');
      req.flush({ message: 'Credenciales inválidas' }, { status: 401, statusText: 'Unauthorized' });
      const result = await promise;

      // Assert
      expect(result.success).toBeFalse();
      expect(result.message).toContain('Credenciales inválidas');
    });

    it('AU-16: login error con array de mensajes los une', async () => {
      // Act
      const promise = service.login({ email: 'x', password: 'x' });
      const req = httpMock.expectOne('/api/auth/login');
      req.flush({ message: ['Error 1', 'Error 2'] }, { status: 400, statusText: 'Bad Request' });
      const result = await promise;

      // Assert
      expect(result.message).toContain('Error 1');
      expect(result.message).toContain('Error 2');
    });
  });

  // ──────────── AU-17: signup ────────────
  describe('signup', () => {
    it('AU-17: signup con error HTTP retorna mensaje genérico', async () => {
      // Arrange
      const userData = { username: 'newchef', email: 'n@n.com', password: '123' } as any;

      // Act
      const promise = service.signup(userData);
      const req = httpMock.expectOne('/api/users');
      req.flush(null, { status: 500, statusText: 'Server Error' });
      const result = await promise;

      // Assert
      expect(result.success).toBeFalse();
      expect(result.message).toContain('Error al intentar registrar');
    });

    it('AU-18: signup con error retorna mensaje (Stub error)', async () => {
      // Act
      const promise = service.signup({ username: 'x', email: 'x', password: 'x' } as any);
      const req = httpMock.expectOne('/api/users');
      req.flush({ message: 'Email duplicado' }, { status: 409, statusText: 'Conflict' });
      const result = await promise;

      // Assert
      expect(result.success).toBeFalse();
      expect(result.message).toContain('Email duplicado');
    });
  });
});
