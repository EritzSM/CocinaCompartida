import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipeDetail } from '../../../src/app/features/pages/recipe-detail/recipe-detail';
import { RecipeService } from '../../../src/app/shared/services/recipe';
import { Auth } from '../../../src/app/shared/services/auth';
import { Recipe } from '../../../src/app/shared/interfaces/recipe';

type BuildOptions = {
  routeId: string | null;
  recipe?: Recipe | null;
  throws?: boolean;
};

type Stubs = {
  recipe: {
    getRecipeById: jasmine.Spy;
    addComment: jasmine.Spy;
    deleteRecipe: jasmine.Spy;
    downloadPDF: jasmine.Spy;
    downloadImage: jasmine.Spy;
  };
  auth: {
    isLoged: jasmine.Spy;
    getUserProfile: jasmine.Spy;
    getCurrentUser: jasmine.Spy;
  };
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
    { id: 'c2', message: 'Excelente', user: { id: 'u3', username: 'fan2' }, createdAt: new Date(), updatedAt: new Date() },
  ],
};

const RECIPE_NO_COMMENTS: Recipe = {
  ...RECIPE_WITH_COMMENTS,
  comments: [],
};

function buildStubs(options: BuildOptions): Stubs {
  return {
    recipe: {
      getRecipeById: jasmine.createSpy('getRecipeById').and.callFake(async () => {
        if (options.throws) throw new Error('network');
        return options.recipe ?? null;
      }),
      addComment: jasmine.createSpy('addComment'),
      deleteRecipe: jasmine.createSpy('deleteRecipe'),
      downloadPDF: jasmine.createSpy('downloadPDF'),
      downloadImage: jasmine.createSpy('downloadImage'),
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

describe('Ver Comentario Regression Frontend', () => {
  beforeEach(() => TestBed.resetTestingModule());

  // Verifica que la receta con comentarios se carga sin errores.
  it('VerComentario_CuandoRecetaTieneComentarios_DebeCargarComentarios', async () => {
    // Arrange
    const { component } = await buildComponent({
      routeId: 'r1',
      recipe: RECIPE_WITH_COMMENTS,
    });

    // Act
    component.ngOnInit();
    await flush();

    // Assert
    expect(component.recipe).toEqual(RECIPE_WITH_COMMENTS);
    expect(component.recipe!.comments!.length).toBe(2);
    expect(component.error).toBeNull();
  });

  // Verifica que una receta sin comentarios mantiene la lista vacia.
  it('VerComentario_CuandoRecetaSinComentarios_DebeMantenerListaVacia', async () => {
    // Arrange
    const { component } = await buildComponent({
      routeId: 'r1',
      recipe: RECIPE_NO_COMMENTS,
    });

    // Act
    component.ngOnInit();
    await flush();

    // Assert
    expect(component.recipe).toEqual(RECIPE_NO_COMMENTS);
    expect(component.recipe!.comments!.length).toBe(0);
    expect(component.error).toBeNull();
  });

  // Verifica que sin id de receta se redirige y se muestra error de URL.
  it('VerComentario_CuandoNoHayIdEnRuta_DebeRedirigirYSetearError', async () => {
    // Arrange
    const { component, stubs } = await buildComponent({
      routeId: null,
      recipe: null,
    });

    // Act
    component.ngOnInit();
    await flush();

    // Assert
    expect(stubs.router.navigate).toHaveBeenCalledWith(['/home']);
    expect(component.error).toContain('Error de URL');
    expect(component.isLoading).toBe(false);
  });

  // Verifica que un fallo del servicio setea un error generico.
  it('VerComentario_CuandoServicioFalla_DebeSetearErrorGenerico', async () => {
    // Arrange
    const { component } = await buildComponent({
      routeId: 'r1',
      throws: true,
    });

    // Act
    component.ngOnInit();
    await flush();

    // Assert
    expect(component.recipe).toBeUndefined();
    expect(component.error).toContain('Hubo un problema');
    expect(component.isLoading).toBe(false);
  });
});
