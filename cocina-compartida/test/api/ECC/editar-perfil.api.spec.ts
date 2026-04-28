import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import Swal from 'sweetalert2';
import { EditProfileService } from '../../../src/app/shared/services/edit-profile.service';
import { Auth } from '../../../src/app/shared/services/auth';
import { UploadService } from '../../../src/app/shared/services/upload';
import { RecipeService } from '../../../src/app/shared/services/recipe';
import { Router } from '@angular/router';
import { User } from '../../../src/app/shared/interfaces/user';

describe('Editar Perfil API Frontend', () => {
  let service: EditProfileService;
  let httpMock: HttpTestingController;
  let authStub: any;
  let recipeStub: any;

  beforeEach(() => {
    const currentUser: User = {
      id: 'u1',
      username: 'testuser',
      password: '',
      email: 'test@test.com',
      avatar: 'av.png',
      bio: 'bio',
    };

    authStub = {
      currentUser: signal<User | null>(currentUser),
      currentUsername: signal<string>(currentUser.username),
      getCurrentUser: () => authStub.currentUser(),
    };

    recipeStub = {
      loadRecipes: jasmine.createSpy('loadRecipes'),
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        EditProfileService,
        { provide: Auth, useValue: authStub },
        { provide: UploadService, useValue: { uploadFile: jasmine.createSpy('uploadFile') } },
        { provide: RecipeService, useValue: recipeStub },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
      ],
    });

    service = TestBed.inject(EditProfileService);
    httpMock = TestBed.inject(HttpTestingController);
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({} as any));
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('token');
  });

  // Verifica que updateProfile envia PATCH con Authorization y actualiza el estado.
  it('EditarPerfilApi_CuandoUpdateProfile_EnviaPatchConAuthHeader', async () => {
    // Arrange
    localStorage.setItem('token', 'token');
    const updated: User = {
      id: 'u1',
      username: 'nuevo',
      password: '',
      email: 'test@test.com',
      avatar: 'av.png',
      bio: 'bio nueva',
    };

    // Act
    const promise = service.updateProfile({ username: 'nuevo' });
    const req = httpMock.expectOne('/api/users');

    // Assert
    expect(req.request.method).toBe('PATCH');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token');
    req.flush(updated);
    const result = await promise;
    expect(result).toEqual(updated);
    expect(authStub.currentUser()).toEqual(updated);
    expect(authStub.currentUsername()).toBe('nuevo');
    expect(recipeStub.loadRecipes).toHaveBeenCalled();
  });

  // Verifica que un error de API retorna null y no cambia el usuario actual.
  it('EditarPerfilApi_CuandoUpdateProfileFalla_DebeRetornarNull', async () => {
    // Arrange
    localStorage.setItem('token', 'token');
    const before = authStub.currentUser();

    // Act
    const promise = service.updateProfile({ username: 'nuevo' });
    const req = httpMock.expectOne('/api/users');
    req.flush({ message: 'error' }, { status: 500, statusText: 'Server Error' });
    const result = await promise;

    // Assert
    expect(result).toBeNull();
    expect(authStub.currentUser()).toEqual(before);
  });
});
