import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

import { EditProfileService } from '../shared/services/edit-profile.service';
import { Auth } from '../shared/services/auth';
import { RecipeService } from '../shared/services/recipe';
import { UploadService } from '../shared/services/upload';
import { User } from '../shared/interfaces/user';

describe('Gestión de Datos del Perfil — EditProfileService', () => {
  let service: EditProfileService;
  let httpMock: HttpTestingController;
  let authMock: any;
  let recipeMock: any;
  let uploadMock: any;
  let router: Router;

  const mockUser: User = {
    id: 'user-123',
    username: 'testuser',
    email: 'test@test.com',
    password: '',
    avatar: 'https://example.com/avatar.png',
    bio: 'Bio de prueba',
  };

  beforeEach(() => {
    // ─── Arrange — Mocks de dependencias con Jasmine ──────────────────────
    authMock = jasmine.createSpyObj('Auth', ['getCurrentUser', 'logout'], {
      currentUser: jasmine.createSpyObj('currentUser', ['set']),
      currentUsername: jasmine.createSpyObj('currentUsername', ['set'])
    });
    authMock.getCurrentUser.and.returnValue(mockUser);

    recipeMock = jasmine.createSpyObj('RecipeService', ['loadRecipes']);

    uploadMock = jasmine.createSpyObj('UploadService', ['uploadFile']);
    uploadMock.uploadFile.and.resolveTo({ success: true, data: 'https://cdn.com/new-avatar.png' });

    // Mock de SweetAlert2
    spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([{ path: 'login', component: class {} }])
      ],
      providers: [
        EditProfileService,
        { provide: Auth, useValue: authMock },
        { provide: RecipeService, useValue: recipeMock },
        { provide: UploadService, useValue: uploadMock },
      ],
    });

    service = TestBed.inject(EditProfileService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 1: updateProfile — Contrato y Seguridad
  // ═══════════════════════════════════════════════════════════════════════════
  describe('updateProfile()', () => {

    it('Dado un usuario autenticado, cuando actualiza su perfil, entonces envía PATCH con headers de Authorization', fakeAsync(() => {
      // Arrange
      localStorage.setItem('token', 'jwt-test-token-123');
      const updateData = { username: 'nuevoNombre', bio: 'Nueva bio' };

      // Act
      service.updateProfile(updateData).then();
      tick();

      // Assert — Verificar que la petición PATCH incluye Authorization
      const req = httpMock.expectOne('/api/users');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.headers.has('Authorization')).toBeTrue();
      expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-test-token-123');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');

      // Simular respuesta exitosa
      req.flush({ ...mockUser, ...updateData });
      tick();

      localStorage.removeItem('token');
    }));

    it('Dado una actualización exitosa, entonces actualiza las señales de Auth (currentUser + currentUsername)', fakeAsync(() => {
      // Arrange
      localStorage.setItem('token', 'jwt-test-token-123');
      const updatedUser: User = { ...mockUser, username: 'actualizado' };

      // Act
      let result: User | null = null;
      service.updateProfile({ username: 'actualizado' }).then(r => result = r);
      tick();

      const req = httpMock.expectOne('/api/users');
      req.flush(updatedUser);
      tick();

      // Assert — Las señales de Auth fueron actualizadas
      expect(authMock.currentUser.set).toHaveBeenCalledWith(updatedUser);
      expect(authMock.currentUsername.set).toHaveBeenCalledWith('actualizado');
      expect(recipeMock.loadRecipes).toHaveBeenCalled();
      expect(result as any).toEqual(updatedUser);

      localStorage.removeItem('token');
    }));

    it('Dado un usuario sin id, cuando intenta updateProfile, entonces retorna null sin hacer petición', async () => {
      // Arrange — getCurrentUser retorna un usuario sin id
      authMock.getCurrentUser.and.returnValue(null);

      // Act
      const result = await service.updateProfile({ username: 'test' });

      // Assert
      expect(result).toBeNull();
      httpMock.expectNone('/api/users');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 2: fetchUserById — Manejo de 401
  // ═══════════════════════════════════════════════════════════════════════════
  describe('fetchUserById()', () => {

    it('Dado un userId válido, cuando se consulta, entonces retorna el usuario', fakeAsync(() => {
      // Arrange
      localStorage.setItem('token', 'jwt-test-token-123');

      // Act
      let result: User | null | 'unauthorized' = null;
      service.fetchUserById('user-456').then(r => result = r);
      tick();

      const req = httpMock.expectOne('/api/users/user-456');
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
      tick();

      // Assert
      expect(result as any).toEqual(mockUser);

      localStorage.removeItem('token');
    }));

    it('Dado un error 401 del servidor, cuando se consulta un perfil, entonces retorna "unauthorized"', fakeAsync(() => {
      // Arrange
      localStorage.setItem('token', 'token-expirado');

      // Act
      let result: User | null | 'unauthorized' = null;
      service.fetchUserById('user-456').then(r => result = r);
      tick();

      const req = httpMock.expectOne('/api/users/user-456');
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
      tick();

      // Assert
      expect(result as any).toBe('unauthorized');

      localStorage.removeItem('token');
    }));
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 3: deleteAccount — Flujo completo
  // ═══════════════════════════════════════════════════════════════════════════
  describe('deleteAccount()', () => {

    it('Dado confirmación del usuario, cuando se elimina la cuenta, entonces invoca auth.logout()', fakeAsync(() => {
      // Arrange
      localStorage.setItem('token', 'jwt-test-token-123');

      // Act
      let result = false;
      service.deleteAccount().then(r => result = r);
      tick();

      const req = httpMock.expectOne(`/api/users/${mockUser.id}`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-test-token-123');
      req.flush(null);
      tick();

      // Assert
      expect(result).toBe(true);
      expect(authMock.logout).toHaveBeenCalled();

      localStorage.removeItem('token');
    }));
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 4: Seguridad — Verificación de headers JWT
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Seguridad — Headers JWT', () => {

    it('Dado un token en localStorage, getAuthOptions incluye Authorization: Bearer <token>', fakeAsync(() => {
      // Arrange
      localStorage.setItem('token', 'mi-jwt-secreto');

      // Act — Disparar cualquier petición para inspeccionar headers
      service.updateProfile({ username: 'check' }).then();
      tick();

      const req = httpMock.expectOne('/api/users');

      // Assert
      expect(req.request.headers.get('Authorization')).toBe('Bearer mi-jwt-secreto');

      req.flush(mockUser);
      tick();
      localStorage.removeItem('token');
    }));

    it('Dado que NO hay token en localStorage, entonces no incluye header Authorization con Bearer', fakeAsync(() => {
      // Arrange
      localStorage.removeItem('token');

      // Act
      service.updateProfile({ username: 'sintoken' }).then();
      tick();

      const req = httpMock.expectOne('/api/users');

      // Assert — No debería haber Authorization con Bearer
      const authHeader = req.request.headers.get('Authorization');
      expect(authHeader).toBeFalsy();

      req.flush(mockUser);
      tick();
    }));
  });
});
