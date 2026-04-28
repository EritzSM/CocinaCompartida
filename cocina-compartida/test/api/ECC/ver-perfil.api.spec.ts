import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { signal } from '@angular/core';
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
  return {
    auth: {
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue(options.cachedUser ?? null),
      verifyLoggedUser: jasmine.createSpy('verifyLoggedUser'),
    },
    edit: {
      fetchUserById: jasmine
        .createSpy('fetchUserById')
        .and.returnValue(Promise.resolve(options.fetchResult ?? null)),
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

describe('Ver Perfil API Frontend', () => {
  beforeEach(() => TestBed.resetTestingModule());

  // Verifica que con id en ruta se solicita el perfil al servicio.
  it('VerPerfil_CuandoIdEnRuta_DebeSolicitarUsuarioPorApi', async () => {
    // Arrange
    const profile: User = {
      id: '99',
      username: 'otheruser',
      password: '',
      email: 'other@test.com',
      avatar: 'av.png',
      bio: 'bio',
    };
    const { component, stubs } = await buildComponent({
      routeId: '99',
      fetchResult: profile,
    });

    // Act
    component.ngOnInit();
    await flush();

    // Assert
    expect(stubs.edit.fetchUserById).toHaveBeenCalledWith('99');
    expect(component.user()).toEqual(profile);
    expect(component.isOwnProfile()).toBe(false);
  });

  // Verifica que sin id en ruta no se llama a fetchUserById.
  it('VerPerfil_CuandoNoHayId_NoDebeSolicitarUsuarioPorApi', async () => {
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
    expect(stubs.edit.fetchUserById).not.toHaveBeenCalled();
    expect(component.user()).toEqual(cached);
  });
});
