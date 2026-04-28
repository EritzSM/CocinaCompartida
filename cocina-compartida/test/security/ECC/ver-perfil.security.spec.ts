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
  cachedUser?: User | null;
  recipes?: Recipe[];
};

type Stubs = {
  auth: { getCurrentUser: jasmine.Spy; verifyLoggedUser: jasmine.Spy };
  edit: { fetchUserById: jasmine.Spy };
  recipes: { recipes: any; loadRecipes: jasmine.Spy };
  router: { navigate: jasmine.Spy };
  route: { snapshot: { paramMap: { get: () => string | null } } };
};

function buildStubs(options: BuildOptions): Stubs {
  const recipesSignal = signal<Recipe[]>(options.recipes ?? []);
  return {
    auth: {
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue(options.cachedUser ?? null),
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

describe('Ver Perfil Security Frontend', () => {
  beforeEach(() => TestBed.resetTestingModule());

  // Verifica que un unauthorized del servicio redirige a home.
  it('VerPerfil_CuandoServicioRetornaUnauthorized_DebeRedirigirHome', async () => {
    // Arrange
    const { component, stubs } = await buildComponent({
      routeId: '99',
      fetchResult: 'unauthorized',
    });

    // Act
    component.ngOnInit();
    await flush();

    // Assert
    expect(component.user()).toBeNull();
    expect(stubs.router.navigate).toHaveBeenCalledWith(['/home']);
  });

  // Verifica que en perfil ajeno no se muestran favoritos del usuario actual.
  it('VerPerfil_CuandoEsPerfilAjeno_NoDebeMostrarFavoritos', async () => {
    // Arrange
    const profile: User = {
      id: '99',
      username: 'otheruser',
      password: '',
      email: 'other@test.com',
      avatar: 'av.png',
      bio: 'bio',
    };
    const current: User = {
      id: '1',
      username: 'testuser',
      password: '',
      email: 'test@test.com',
      avatar: 'av.png',
      bio: 'bio',
    };
    const recipes: Recipe[] = [
      {
        id: 'r1',
        name: 'A',
        descripcion: 'desc',
        ingredients: ['x'],
        steps: ['s1'],
        images: ['img'],
        user: { id: '99', username: 'otheruser' },
        category: 'cat',
        likedBy: ['1'],
      },
    ];
    const { component } = await buildComponent({
      routeId: '99',
      fetchResult: profile,
      cachedUser: current,
      recipes,
    });

    // Act
    component.ngOnInit();
    await flush();

    // Assert
    expect(component.isOwnProfile()).toBe(false);
    expect(component.favoriteRecipes()).toEqual([]);
  });
});
