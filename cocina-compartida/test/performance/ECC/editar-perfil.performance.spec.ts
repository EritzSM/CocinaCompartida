import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { EditProfileService } from '../../../src/app/shared/services/edit-profile.service';
import { Auth } from '../../../src/app/shared/services/auth';
import { UploadService } from '../../../src/app/shared/services/upload';
import { RecipeService } from '../../../src/app/shared/services/recipe';
import { User } from '../../../src/app/shared/interfaces/user';

describe('Editar Perfil Performance Frontend', () => {
  let service: EditProfileService;
  let httpMock: HttpTestingController;

  const USER: User = {
    id: 'u1',
    username: 'testuser',
    password: '',
    email: 'test@test.com',
    avatar: 'av.png',
    bio: 'bio',
  };

  beforeEach(() => {
    const authStub: any = {
      currentUser: signal<User | null>({ ...USER }),
      currentUsername: signal<string>(USER.username),
      getCurrentUser: () => authStub.currentUser(),
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        EditProfileService,
        { provide: Auth, useValue: authStub },
        { provide: UploadService, useValue: { uploadFile: jasmine.createSpy('uploadFile') } },
        { provide: RecipeService, useValue: { loadRecipes: jasmine.createSpy('loadRecipes') } },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
      ],
    });

    service = TestBed.inject(EditProfileService);
    httpMock = TestBed.inject(HttpTestingController);
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({} as any));
    localStorage.setItem('token', 'token');
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('token');
  });

  // Mide latencia promedio sobre N updates secuenciales.
  it('EditarPerfil_CuandoSeEjecutan20UpdatesSecuenciales_LatenciaPromedioDebeSerInferiorA50ms', async () => {
    // Arrange
    const iterations = 20;
    const maxAverageMs = 50;

    // Act
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      const promise = service.updateProfile({ username: `user_${i}` });
      const req = httpMock.expectOne('/api/users');
      req.flush({ ...USER, username: `user_${i}` });
      await promise;
    }
    const averageMs = (performance.now() - start) / iterations;

    // Assert
    expect(averageMs).toBeLessThan(maxAverageMs);
  });

  // Mide throughput bajo updates concurrentes.
  it('EditarPerfil_CuandoSeEjecutan10UpdatesEnParalelo_DebeFinalizarEnMenosDe300ms', async () => {
    // Arrange
    const concurrent = 10;
    const maxTotalMs = 300;

    // Act
    const start = performance.now();
    const promises = Array.from({ length: concurrent }).map((_, i) =>
      service.updateProfile({ username: `user_${i}` })
    );
    const requests = httpMock.match('/api/users');
    requests.forEach((req, i) => req.flush({ ...USER, username: `user_${i}` }));
    await Promise.all(promises);
    const totalMs = performance.now() - start;

    // Assert
    expect(totalMs).toBeLessThan(maxTotalMs);
  });
});
