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
  fetchResult?: User | null | 'unauthorized';
};

type Stubs = {
  auth: { getCurrentUser: jasmine.Spy; verifyLoggedUser: jasmine.Spy };
  edit: { fetchUserById: jasmine.Spy };
  recipes: { recipes: any; loadRecipes: jasmine.Spy };
  router: { navigate: jasmine.Spy };
  route: { snapshot: { paramMap: { get: () => string | null } } };
};

function buildStubs(options: BuildOptions): Stubs {
  const recipesSignal = signal<Recipe[]>([]);
  return {
    auth: {
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue(null),
      verifyLoggedUser: jasmine.createSpy('verifyLoggedUser'),
    },
    edit: {
      fetchUserById: jasmine
        .createSpy('fetchUserById')
        .and.returnValue(Promise.resolve(options.fetchResult ?? null)),
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

describe('Ver Perfil Performance Frontend', () => {
  beforeEach(() => TestBed.resetTestingModule());

  // Verifica que no se revalida sesión cuando ya hay id en la ruta.
  it('VerPerfil_CuandoIdEnRuta_NoDebeInvocarVerifyLoggedUser', async () => {
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
    expect(stubs.auth.verifyLoggedUser).not.toHaveBeenCalled();
  });

  // Verifica que el fetch de perfil se hace una sola vez.
  it('VerPerfil_CuandoIdEnRuta_DebeLlamarFetchUnaSolaVez', async () => {
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
    expect(stubs.edit.fetchUserById).toHaveBeenCalledTimes(1);
  });
});
