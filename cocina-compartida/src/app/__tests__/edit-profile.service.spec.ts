import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { EditProfileService } from '../shared/services/edit-profile.service';
import { Auth } from '../shared/services/auth';
import { UploadService } from '../shared/services/upload';
import { RecipeService } from '../shared/services/recipe';
import { User } from '../shared/interfaces/user';

describe('Frontend - EditProfileService (Perfil de Usuario)', () => {
  let service: EditProfileService;
  let httpMock: HttpTestingController;
  let authSpy: jasmine.SpyObj<Auth>;
  let routerSpy: jasmine.SpyObj<Router>;
  let recipeSpy: jasmine.SpyObj<RecipeService>;

  beforeEach(() => {
    // Arrange: Creamos Test Doubles (Spies) para aislar dependencias complejas
    authSpy = jasmine.createSpyObj('Auth', ['getCurrentUser', 'logout']);
    // Fake signals/properties en el Spy
    authSpy.currentUser = { set: jasmine.createSpy('set') } as any;
    authSpy.currentUsername = { set: jasmine.createSpy('set') } as any;

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    recipeSpy = jasmine.createSpyObj('RecipeService', ['loadRecipes']);

    // Test Double (Spy): Interceptamos SweetAlert para que no abra popups de UI en las pruebas (Evita lockear Jasmine)
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        EditProfileService,
        { provide: Auth, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        { provide: RecipeService, useValue: recipeSpy },
        { provide: UploadService, useValue: jasmine.createSpyObj('UploadService', ['uploadFile']) }
      ]
    });

    service = TestBed.inject(EditProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // PU-01 a PU-06: Ver e interactuar con perfiles
  describe('fetchUserById() – PU-01: Ver Perfil', () => {
    it('debe hacer GET al usuario si está autenticado/existe en DB', async () => {
      // Arrange
      const userId = 'uuid-2';
      // Test Double (Dummy): Objeto usuario esperado
      const expectedUser = { id: 'uuid-2', username: 'pedro', email: 'p@p.com' } as User;

      // Act
      const fetchPromise = service.fetchUserById(userId);

      // Test Double (Mock Http): Respondemos con éxito
      const req = httpMock.expectOne(`/api/users/${userId}`);
      expect(req.request.method).toBe('GET');
      req.flush(expectedUser);

      const result = await fetchPromise;

      // Assert
      expect(result).toEqual(expectedUser);
    });

    it('PU-02/PU-03/PU-06: debe devolver unauthorized o null ante errores (Test Double Stub 401)', async () => {
      // Arrange
      const userId = 'unauthorized-user';

      // Act
      const fetchPromise = service.fetchUserById(userId);

      // Test Double (Stub): Forzamos error de autorización 401
      const req = httpMock.expectOne(`/api/users/${userId}`);
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      const result = await fetchPromise;

      // Assert
      expect(result).toBe('unauthorized');
      // Verificamos que el Spy de Swal se llamó advirtiendo al usuario para loguearse
      expect(Swal.fire).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('updateProfile() – Modificar Perfil', () => {
    it('debe hacer PATCH, actualizar el estado de Auth y llamar loadRecipes', async () => {
      // Arrange
      const mockCurrent = { id: 'uuid-1', username: 'juan', email: 'juan@test.com' };
      authSpy.getCurrentUser.and.returnValue(mockCurrent as User);

      // Test Double (Dummy): Data enviada
      const changes = { bio: 'Chef principiante' };
      // Respuesta de éxito
      const updatedUser = { ...mockCurrent, bio: 'Chef principiante' };

      // Act
      const updatePromise = service.updateProfile(changes);

      // Test Double (Mock Http)
      const req = httpMock.expectOne('/api/users');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(changes);
      req.flush(updatedUser);

      const result = await updatePromise;

      // Assert
      expect(result).toEqual(updatedUser as User);
      // Validamos los spies
      expect(authSpy.currentUser.set).toHaveBeenCalledWith(updatedUser as User);
      expect(authSpy.currentUsername.set).toHaveBeenCalledWith('juan');
      expect(recipeSpy.loadRecipes).toHaveBeenCalled();
      // Toast exitoso debió mostrarse
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'success' }));
    });

    it('debe retornar null e ignorar updates si no hay usuario autenticado (Stub currentUser nulo)', async () => {
      // Arrange - Test Double (Stub)
      authSpy.getCurrentUser.and.returnValue(null);

      // Act
      const updatePromise = service.updateProfile({ bio: 'test' });
      const result = await updatePromise;

      // Assert
      expect(result).toBeNull();
      httpMock.expectNone('/api/users');
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'error' }));
    });
  });
});
