import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipeDetail } from '../../../src/app/features/pages/recipe-detail/recipe-detail';
import { RecipeService } from '../../../src/app/shared/services/recipe';
import { Auth } from '../../../src/app/shared/services/auth';
import { Recipe } from '../../../src/app/shared/interfaces/recipe';

type BuildOptions = {
  routeId: string | null;
  recipe?: Recipe | null;
};

type Stubs = {
  recipe: { getRecipeById: jasmine.Spy };
  auth: { isLoged: jasmine.Spy; getUserProfile: jasmine.Spy; getCurrentUser: jasmine.Spy };
  router: { navigate: jasmine.Spy };
  route: { snapshot: { paramMap: { get: () => string | null } } };
};

const RECIPE_WITH_COMMENTS: Recipe = {
  id: 'r1',
  name: 'Pasta',
  descripcion: 'Desc',
  ingredients: ['pasta'],
  steps: ['cocinar'],
  images: ['img.png'],
  category: 'Italiana',
  user: { id: 'u1', username: 'chef' },
  comments: [
    { id: 'c1', message: 'Buenisima', user: { id: 'u2', username: 'fan' }, createdAt: new Date(), updatedAt: new Date() },
  ],
};

function buildStubs(options: BuildOptions): Stubs {
  return {
    recipe: {
      getRecipeById: jasmine.createSpy('getRecipeById').and.returnValue(Promise.resolve(options.recipe ?? null)),
    },
    auth: {
      isLoged: jasmine.createSpy('isLoged').and.returnValue(true),
      getUserProfile: jasmine.createSpy('getUserProfile').and.returnValue({ id: 'u1', username: 'chef' }),
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue({ id: 'u1', username: 'chef' }),
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
    imports: [RecipeDetail],
    providers: [
      { provide: RecipeService, useValue: stubs.recipe },
      { provide: Auth, useValue: stubs.auth },
      { provide: Router, useValue: stubs.router },
      { provide: ActivatedRoute, useValue: stubs.route },
    ],
  }).compileComponents();

  return {
    component: TestBed.createComponent(RecipeDetail).componentInstance,
    stubs,
  };
}

const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

describe('Ver Comentario Performance Frontend', () => {
  beforeEach(() => TestBed.resetTestingModule());

  // Verifica que la carga de receta no repite la llamada al servicio.
  it('VerComentario_CuandoIdEnRuta_DebeLlamarGetRecipeUnaSolaVez', async () => {
    // Arrange
    const { component, stubs } = await buildComponent({
      routeId: 'r1',
      recipe: RECIPE_WITH_COMMENTS,
    });

    // Act
    component.ngOnInit();
    await flush();

    // Assert
    expect(stubs.recipe.getRecipeById).toHaveBeenCalledTimes(1);
  });

  // Verifica que sin id no se llama al servicio.
  it('VerComentario_CuandoNoHayId_NoDebeLlamarGetRecipe', async () => {
    // Arrange
    const { component, stubs } = await buildComponent({
      routeId: null,
      recipe: null,
    });

    // Act
    component.ngOnInit();
    await flush();

    // Assert
    expect(stubs.recipe.getRecipeById).not.toHaveBeenCalled();
  });
});
