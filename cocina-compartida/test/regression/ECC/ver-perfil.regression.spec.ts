import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { signal } from '@angular/core';
import Swal from 'sweetalert2';
import { Profile } from '../../../src/app/features/pages/profile/profile';
import { Auth } from '../../../src/app/shared/services/auth';
import { RecipeService } from '../../../src/app/shared/services/recipe';
import { EditProfileService } from '../../../src/app/shared/services/edit-profile.service';
import { User } from '../../../src/app/shared/interfaces/user';
import { Recipe } from '../../../src/app/shared/interfaces/recipe';

type BuildOptions = {
  routeId: string | null;
  cachedUser?: User | null;
  fetchResult?: User | null | 'unauthorized';
  fetchThrows?: boolean;
};

type Stubs = {
  auth: { getCurrentUser: jasmine.Spy; verifyLoggedUser: jasmine.Spy };
  edit: {
    fetchUserById: jasmine.Spy;
    uploadAvatar: jasmine.Spy;
    updateProfile: jasmine.Spy;
    deleteAccount: jasmine.Spy;
  };
  recipes: { recipes: any; loadRecipes: jasmine.Spy };
  router: { navigate: jasmine.Spy };
  route: { snapshot: { paramMap: { get: () => string | null } } };
};

function buildStubs(options: BuildOptions): Stubs {
  const recipesSignal = signal<Recipe[]>([]);
  const fetchUserById = jasmine.createSpy('fetchUserById').and.callFake(() => {
    if (options.fetchThrows) return Promise.reject(new Error('network'));
    return Promise.resolve(options.fetchResult ?? null);
  });

  return {
    auth: {
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue(options.cachedUser ?? null),
      verifyLoggedUser: jasmine.createSpy('verifyLoggedUser'),
    },
    edit: {
      fetchUserById,
      uploadAvatar: jasmine.createSpy('uploadAvatar'),
      updateProfile: jasmine.createSpy('updateProfile'),
      deleteAccount: jasmine.createSpy('deleteAccount'),
    },
    recipes: {
      recipes: recipesSignal,
      loadRecipes: jasmine.createSpy('loadRecipes'),
    },
    router: {
      navigate: jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true)),
    },
    route: {
      snapshot: { paramMap: { get: () => options.routeId } },
    },
  };
}

async function buildComponent(options: BuildOptions) {
  const stubs = buildStubs(options);
  await TestBed.configureTestingModule({
    imports: [Profile],
    providers: [
      { provide: Auth, useValue: stubs.auth },
      { provide: EditProfileService, useValue: stubs.edit },
      { provide: RecipeService, useValue: stubs.recipes },
      { provide: Router, useValue: stubs.router },
      { provide: ActivatedRoute, useValue: stubs.route },
    ],
  }).compileComponents();

  return {
    component: TestBed.createComponent(Profile).componentInstance,
    stubs,
  };
}

const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

describe('Ver Perfil Regression Frontend', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({} as any));
  });

  // Verifica que el perfil propio se carga desde cache sin redirecciones.
  it('VerPerfil_CuandoNoHayIdYUsuarioEnCache_DebeMostrarPerfilPropio', async () => {
    // Arrange
    const cached: User = {
      id: '1',
      username: 'testuser',
      password: '',
      email: 'test@test.com',
      avatar: 'av.png',
      bio: 'bio',
    };
    const { component, stubs } = await buildComponent({
      routeId: null,
      cachedUser: cached,
    });

    // Act
    component.ngOnInit();
    await flush();

    // Assert
    expect(component.user()).toEqual(cached);
    expect(component.isOwnProfile()).toBe(true);
    expect(stubs.router.navigate).not.toHaveBeenCalled();
  });

  // Verifica que se intenta revalidar sesión cuando no hay cache.
  it('VerPerfil_CuandoNoHayCache_DebeInvocarVerifyLoggedUser', async () => {
    // Arrange
    const { component, stubs } = await buildComponent({
      routeId: null,
      cachedUser: null,
    });

    // Act
    component.ngOnInit();
    await flush();

    // Assert
    expect(stubs.auth.verifyLoggedUser).toHaveBeenCalled();
  });

  // Verifica la redirección a home cuando el usuario no existe.
  it('VerPerfil_CuandoUsuarioNoExiste_DebeRedirigirHome', async () => {
    // Arrange
    const { component, stubs } = await buildComponent({
      routeId: '99',
      fetchResult: null,
    });

    // Act
    component.ngOnInit();
    await flush();

    // Assert
    expect(component.user()).toBeNull();
    expect(stubs.router.navigate).toHaveBeenCalledWith(['/home']);
  });

  // Verifica que ante fallo se restaura el estado y se redirige.
  it('VerPerfil_CuandoFetchFalla_DebeRestablecerIsOwnProfileYRedirigir', async () => {
    // Arrange
    const { component, stubs } = await buildComponent({
      routeId: '99',
      fetchThrows: true,
    });

    // Act
    component.ngOnInit();
    await flush();

    // Assert
    expect(component.isOwnProfile()).toBe(true);
    expect(stubs.router.navigate).toHaveBeenCalledWith(['/home']);
  });
});
