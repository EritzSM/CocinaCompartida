import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EditProfileService } from '../shared/services/edit-profile.service';
import { Auth } from '../shared/services/auth';
import { UploadService } from '../shared/services/upload';
import { RecipeService } from '../shared/services/recipe';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

describe('EditProfileService (Extra)', () => {
  let service: EditProfileService;
  let httpMock: HttpTestingController;
  let mockAuth: any;
  let mockUpload: any;
  let mockRecipes: any;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    // Arrange — Stubs & Spies
    mockAuth = {
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue({
        id: 'u1', username: 'testuser', email: 'test@test.com', bio: '', avatar: '', password: ''
      }),
      currentUser: { set: jasmine.createSpy('currentUser.set') },
      currentUsername: { set: jasmine.createSpy('currentUsername.set') },
      logout: jasmine.createSpy('logout')
    };

    mockUpload = {
      uploadFile: jasmine.createSpy('uploadFile').and.returnValue(
        Promise.resolve({ success: true, data: 'avatar-url.jpg' })
      )
    };

    mockRecipes = {
      loadRecipes: jasmine.createSpy('loadRecipes')
    };

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockRouter.navigate.and.returnValue(Promise.resolve(true));

    spyOn(Swal, 'fire').and.returnValue(
      Promise.resolve({ isConfirmed: true, isDenied: false, isDismissed: false } as any)
    );

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        EditProfileService,
        { provide: Auth, useValue: mockAuth },
        { provide: UploadService, useValue: mockUpload },
        { provide: RecipeService, useValue: mockRecipes },
        { provide: Router, useValue: mockRouter }
      ]
    });

    service = TestBed.inject(EditProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // EP-01: uploadAvatar éxito retorna URL
  it('EP-01: uploadAvatar success returns URL', async () => {
    // Arrange
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

    // Act
    const result = await service.uploadAvatar(file);

    // Assert
    expect(result).toBe('avatar-url.jpg');
    expect(mockUpload.uploadFile).toHaveBeenCalled();
  });

  // EP-02: uploadAvatar fallo retorna undefined
  it('EP-02: uploadAvatar failure returns undefined', async () => {
    // Arrange
    mockUpload.uploadFile.and.returnValue(Promise.resolve({ success: false, error: 'fail' }));
    const file = new File(['x'], 'bad.jpg', { type: 'image/jpeg' });

    // Act
    const result = await service.uploadAvatar(file);

    // Assert
    expect(result).toBeUndefined();
  });

  // EP-03: updateProfile éxito retorna usuario actualizado
  it('EP-03: updateProfile success returns updated user', async () => {
    // Arrange
    const updated = { id: 'u1', username: 'new', email: 'e@e.com', bio: '', avatar: '', password: '' };

    // Act
    const promise = service.updateProfile({ username: 'new' });
    const req = httpMock.expectOne(r => r.url === '/api/users' && r.method === 'PATCH');
    req.flush(updated);
    const result = await promise;

    // Assert
    expect(result).toEqual(updated);
    expect(mockAuth.currentUser.set).toHaveBeenCalledWith(updated);
  });

  // EP-04: updateProfile sin usuario retorna null
  it('EP-04: updateProfile without current user returns null', async () => {
    // Arrange
    mockAuth.getCurrentUser.and.returnValue(null);

    // Act
    const result = await service.updateProfile({ username: 'x' });

    // Assert
    expect(result).toBeNull();
  });

  // EP-05: fetchUserById éxito retorna usuario
  it('EP-05: fetchUserById success returns user', async () => {
    // Arrange
    const user = { id: 'u2', username: 'other', email: 'o@o.com', bio: '', avatar: '', password: '' };

    // Act
    const promise = service.fetchUserById('u2');
    const req = httpMock.expectOne(r => r.url === '/api/users/u2');
    req.flush(user);
    const result = await promise;

    // Assert
    expect(result).toEqual(user);
  });

  // EP-06: fetchUserById 401 retorna 'unauthorized'
  it('EP-06: fetchUserById 401 returns "unauthorized"', async () => {
    // Act
    const promise = service.fetchUserById('u2');
    const req = httpMock.expectOne(r => r.url === '/api/users/u2');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    const result = await promise;

    // Assert
    expect(result).toBe('unauthorized');
  });

  // EP-07: deleteAccount exitoso retorna true y hace logout
  it('EP-07: deleteAccount confirmed and success returns true', async () => {
    // Arrange — Swal.fire already returns isConfirmed: true

    // Act
    const promise = service.deleteAccount();
    // Allow Swal confirmation promise to resolve before HTTP request is dispatched
    await new Promise(resolve => setTimeout(resolve, 0));
    const req = httpMock.expectOne(r => r.method === 'DELETE' && r.url.includes('/api/users/'));
    req.flush(null);
    const result = await promise;

    // Assert
    expect(result).toBe(true);
    expect(mockAuth.logout).toHaveBeenCalled();
  });

  // EP-08: uploadAvatar usa username del usuario actual
  it('EP-08: uploadAvatar uses current username for upload', async () => {
    // Arrange
    const file = new File(['x'], 'av.png', { type: 'image/png' });

    // Act
    await service.uploadAvatar(file);

    // Assert
    expect(mockUpload.uploadFile).toHaveBeenCalledWith(file, true, 'testuser');
  });
});
