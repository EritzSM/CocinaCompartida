import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipeDetail } from '../app/features/pages/recipe-detail/recipe-detail';
import { RecipeService } from '../app/shared/services/recipe';
import { Auth } from '../app/shared/services/auth';
import { Recipe } from '../app/shared/interfaces/recipe';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  VER COMENTARIOS FRONT – Pruebas por camino (assertion, sin mocks)
//  3 caminos + 2 pruebas de fallo
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const RECIPE_WITH_COMMENTS: Recipe = {
  id: 'r1', name: 'Pasta', descripcion: 'Desc pasta',
  ingredients: ['pasta'], steps: ['cocinar'], images: ['img.png'],
  category: 'Italiana',
  user: { id: 'u1', username: 'chef' },
  comments: [
    { id: 'c1', message: 'Deliciosa!', user: { id: 'u2', username: 'fan' }, createdAt: new Date(), updatedAt: new Date() },
    { id: 'c2', message: 'La mejor receta', user: { id: 'u3', username: 'fan2' }, createdAt: new Date(), updatedAt: new Date() },
  ],
};

const RECIPE_NO_COMMENTS: Recipe = {
  ...RECIPE_WITH_COMMENTS,
  comments: [],
};

function stubs(
  paramId: string | null,
  opts: { recipe?: Recipe | null; throws?: boolean } = {},
) {
  return {
    recipe: {
      getRecipeById: async (_id: string) => {
        if (opts.throws) throw new Error('Network error');
        return opts.recipe ?? null;
      },
      addComment: async () => {},
      deleteRecipe: async () => true,
      downloadPDF: async () => {},
      downloadImage: async () => {},
    },
    auth: {
      isLoged: () => true,
      getCurrentUser: () => ({ id: 'u1', username: 'chef' }),
      getUserProfile: () => ({ id: 'u1', username: 'chef' }),
    },
    router: { navigate: () => Promise.resolve(true) },
    route: { snapshot: { paramMap: { get: () => paramId } } },
  };
}

async function build(paramId: string | null, opts: any = {}) {
  const s = stubs(paramId, opts);
  await TestBed.configureTestingModule({
    imports: [RecipeDetail],
    providers: [
      { provide: RecipeService, useValue: s.recipe },
      { provide: Auth, useValue: s.auth },
      { provide: Router, useValue: s.router },
      { provide: ActivatedRoute, useValue: s.route },
    ],
  }).compileComponents();
  return TestBed.createComponent(RecipeDetail).componentInstance;
}

const wait = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));

describe('Ver Comentarios Front – Pruebas por camino', () => {

  beforeEach(() => TestBed.resetTestingModule());
  afterEach(() => document.querySelectorAll('.swal2-container').forEach(el => el.remove()));

  // ──────────────────────────────────────────────────────────
  //  C1: 1→2→3→4→5→7→8→10→FIN
  //  Receta carga exitosamente, tiene comentarios → se renderizan
  // ──────────────────────────────────────────────────────────
  describe('C1: Receta con comentarios', () => {

    it('C1-T1: recipe tiene comentarios después de cargar', async () => {
      const comp = await build('r1', { recipe: RECIPE_WITH_COMMENTS });
      await comp.ngOnInit();
      await wait();

      expect(comp.recipe).toBeDefined();
      expect(comp.recipe!.comments!.length).toBe(2);
    });

    it('C1-T2: el primer comentario tiene el mensaje correcto', async () => {
      const comp = await build('r1', { recipe: RECIPE_WITH_COMMENTS });
      await comp.ngOnInit();
      await wait();

      expect(comp.recipe!.comments![0].message).toBe('Deliciosa!');
    });

    it('C1-T3: isLoading es false y error es null', async () => {
      const comp = await build('r1', { recipe: RECIPE_WITH_COMMENTS });
      await comp.ngOnInit();
      await wait();

      expect(comp.isLoading).toBe(false);
      expect(comp.error).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C2: 1→2→3→4→5→6→FIN
  //  Petición falla → error de carga
  // ──────────────────────────────────────────────────────────
  describe('C2: Error al cargar receta', () => {

    it('C2-T1: error contiene mensaje de problema', async () => {
      const comp = await build('r1', { throws: true });
      await comp.ngOnInit();
      await wait();

      expect(comp.error).toBeTruthy();
      expect(comp.error).toContain('problema');
    });

    it('C2-T2: recipe es undefined cuando falla la petición', async () => {
      const comp = await build('r1', { throws: true });
      await comp.ngOnInit();
      await wait();

      expect(comp.recipe).toBeUndefined();
    });

    it('C2-T3: isLoading es false tras el error', async () => {
      const comp = await build('r1', { throws: true });
      await comp.ngOnInit();
      await wait();

      expect(comp.isLoading).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C3: 1→2→3→4→5→7→8→9→FIN
  //  Receta existe pero no tiene comentarios
  // ──────────────────────────────────────────────────────────
  describe('C3: Receta sin comentarios', () => {

    it('C3-T1: recipe existe pero comments está vacío', async () => {
      const comp = await build('r1', { recipe: RECIPE_NO_COMMENTS });
      await comp.ngOnInit();
      await wait();

      expect(comp.recipe).toBeDefined();
      expect(comp.recipe!.comments!.length).toBe(0);
    });

    it('C3-T2: no hay error, la carga fue exitosa', async () => {
      const comp = await build('r1', { recipe: RECIPE_NO_COMMENTS });
      await comp.ngOnInit();
      await wait();

      expect(comp.error).toBeNull();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ⛔ PRUEBAS QUE HACEN FALLAR EL CÓDIGO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('⛔ Fallos esperados (bugs)', () => {

    // BUG: Si la URL no trae id de receta, el componente establece un
    // error genérico "Error de URL" pero NO redirige al usuario.
    // El usuario queda en una página vacía sin forma de navegar.
    it('⛔ F1: sin id en URL debería redirigir pero NO lo hace', async () => {
      let navDest: any = null;
      const s = stubs(null, { recipe: null });
      (s.router as any).navigate = (cmds: any[]) => { navDest = cmds; return Promise.resolve(true); };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [RecipeDetail],
        providers: [
          { provide: RecipeService, useValue: s.recipe },
          { provide: Auth, useValue: s.auth },
          { provide: Router, useValue: s.router },
          { provide: ActivatedRoute, useValue: s.route },
        ],
      }).compileComponents();
      const comp = TestBed.createComponent(RecipeDetail).componentInstance;
      await comp.ngOnInit();
      await wait();

      // FALLA: navDest es null porque no se redirige
      expect(navDest).toEqual(['/home']);
    });

    // BUG: Si getRecipeById retorna null (receta eliminada),
    // recipe queda como undefined y error se setea, pero
    // no se diferencia entre "receta eliminada" y "error de red".
    it('⛔ F2: receta no encontrada debería mostrar error distinto al de red', async () => {
      const comp = await build('r1', { recipe: null });
      await comp.ngOnInit();
      await wait();

      // FALLA: el error dice "Es posible que haya sido eliminada",
      // que no es el mismo que "problema al cargar"
      expect(comp.error).toContain('problema');
    });
  });
});
