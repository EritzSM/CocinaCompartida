import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipeDetail } from '../features/pages/recipe-detail/recipe-detail';
import { RecipeService } from '../shared/services/recipe';
import { Auth } from '../shared/services/auth';
import { Recipe } from '../shared/interfaces/recipe';

/**
 * VER COMENTARIOS FRONT – Triple-A / FIRST / 5 tipos de mock
 * ─────────────────────────────────────────────────────────────────────────
 * Tipos de mock utilizados:
 *   DUMMY  → addComment, deleteRecipe, downloadPDF, downloadImage:
 *             requeridos por DI pero nunca invocados en estos tests.
 *             Auth.isLoged, getUserProfile: accedidos en el template pero
 *             no son parte del camino bajo prueba (carga de receta).
 *   STUB   → RecipeService.getRecipeById: devuelve la receta fija o lanza;
 *             ActivatedRoute: paramMap.get retorna el id controlado.
 *   SPY    → Router.navigate: jasmine.createSpy registra si ocurrió
 *             redirección y con qué argumento.
 *   MOCK   → navigateSpy en ⛔F1/F2: la expectativa de navegación a '/home'
 *             es la especificación del comportamiento correcto del componente.
 *   FAKE   → Auth.getCurrentUser: devuelve un usuario plano hardcoded que
 *             reproduce la respuesta real del servicio sin infraestructura.
 *
 * Principios FIRST:
 *   Fast        – Sin peticiones HTTP reales; stubs síncronos/async mínimos.
 *   Independent – Cada test llama a build(); navigateSpy es local por test.
 *   Repeatable  – Datos hardcoded; sin fechas variables ni aleatoriedad.
 *   Self-val.   – Cada test tiene al menos un expect() con resultado booleano.
 *   Timely      – Tests escritos junto al desarrollo de la funcionalidad.
 */

// ── Datos de prueba ────────────────────────────────────────────────────────
const RECIPE_WITH_COMMENTS: Recipe = {
  id: 'r1', name: 'Pasta', descripcion: 'Desc pasta',
  ingredients: ['pasta'], steps: ['cocinar'], images: ['img.png'],
  category: 'Italiana',
  user: { id: 'u1', username: 'chef' },
  comments: [
    { id: 'c1', message: 'Deliciosa!',      user: { id: 'u2', username: 'fan'  }, createdAt: new Date(), updatedAt: new Date() },
    { id: 'c2', message: 'La mejor receta', user: { id: 'u3', username: 'fan2' }, createdAt: new Date(), updatedAt: new Date() },
  ],
};

const RECIPE_NO_COMMENTS: Recipe = { ...RECIPE_WITH_COMMENTS, comments: [] };

// ── Helper: monta el módulo y devuelve el componente + spy ─────────────────
async function buildComponent(
  paramId: string | null,
  opts: { recipe?: Recipe | null; throws?: boolean } = {},
) {
  // [SPY] – registra llamadas a navigate() para verificar redirecciones
  const navigateSpy = jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true));

  await TestBed.configureTestingModule({
    imports: [RecipeDetail],
    providers: [
      {
        provide: RecipeService,
        useValue: {
          // [STUB] – resultado controlado para el camino bajo prueba
          getRecipeById: async (_id: string) => {
            if (opts.throws) throw new Error('Network error');
            return opts.recipe ?? null;
          },
          // [DUMMY] – requeridos por DI pero no ejercitados en estos tests
          addComment:    async () => {},
          deleteRecipe:  async () => true,
          downloadPDF:   async () => {},
          downloadImage: async () => {},
        },
      },
      {
        provide: Auth,
        useValue: {
          // [FAKE] – implementación simplificada que reproduce la respuesta real
          getCurrentUser: () => ({ id: 'u1', username: 'chef' }),
          // [DUMMY] – accedidos en el template pero fuera del camino bajo prueba
          isLoged:         () => true,
          getUserProfile:  () => ({ id: 'u1', username: 'chef' }),
        },
      },
      // [SPY] / [MOCK] – navigate registrado para verificar redirecciones
      { provide: Router,         useValue: { navigate: navigateSpy } },
      // [STUB] – paramMap.get devuelve el id controlado por el test
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => paramId } } } },
    ],
  }).compileComponents();

  return {
    comp: TestBed.createComponent(RecipeDetail).componentInstance,
    navigateSpy,
  };
}

const wait = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));

// ── Suite ──────────────────────────────────────────────────────────────────
describe('Ver Comentarios Front – AAA / FIRST / Mocks', () => {

  beforeEach(() => TestBed.resetTestingModule());
  afterEach(() => {
    document.querySelectorAll('.swal2-container').forEach(el => el.remove());
  });

  // ── C1: Receta carga exitosamente, tiene comentarios ────────────────────
  describe('C1: Receta con comentarios', () => {

    it('C1-T1: recipe tiene los 2 comentarios tras la carga', async () => {
      // Arrange
      const { comp } = await buildComponent('r1', { recipe: RECIPE_WITH_COMMENTS });

      // Act
      await comp.ngOnInit();
      await wait();

      // Assert
      expect(comp.recipe).toBeDefined();
      expect(comp.recipe!.comments!.length).toBe(2);
    });

    it('C1-T2: el primer comentario tiene el mensaje correcto', async () => {
      // Arrange
      const { comp } = await buildComponent('r1', { recipe: RECIPE_WITH_COMMENTS });

      // Act
      await comp.ngOnInit();
      await wait();

      // Assert
      expect(comp.recipe!.comments![0].message).toBe('Deliciosa!');
    });

    it('C1-T3: isLoading es false y error es null tras una carga exitosa', async () => {
      // Arrange
      const { comp } = await buildComponent('r1', { recipe: RECIPE_WITH_COMMENTS });

      // Act
      await comp.ngOnInit();
      await wait();

      // Assert
      expect(comp.isLoading).toBe(false);
      expect(comp.error).toBeNull();
    });
  });

  // ── C2: Petición falla → error de carga ─────────────────────────────────
  describe('C2: Error al cargar receta', () => {

    it('C2-T1: error contiene la palabra "problema"', async () => {
      // Arrange
      const { comp } = await buildComponent('r1', { throws: true });

      // Act
      await comp.ngOnInit();
      await wait();

      // Assert
      expect(comp.error).toBeTruthy();
      expect(comp.error).toContain('problema');
    });

    it('C2-T2: recipe es undefined cuando la petición falla', async () => {
      // Arrange
      const { comp } = await buildComponent('r1', { throws: true });

      // Act
      await comp.ngOnInit();
      await wait();

      // Assert
      expect(comp.recipe).toBeUndefined();
    });

    it('C2-T3: isLoading es false tras el error', async () => {
      // Arrange
      const { comp } = await buildComponent('r1', { throws: true });

      // Act
      await comp.ngOnInit();
      await wait();

      // Assert
      expect(comp.isLoading).toBe(false);
    });
  });

  // ── C3: Receta existe pero sin comentarios ───────────────────────────────
  describe('C3: Receta sin comentarios', () => {

    it('C3-T1: recipe existe pero comments está vacío', async () => {
      // Arrange
      const { comp } = await buildComponent('r1', { recipe: RECIPE_NO_COMMENTS });

      // Act
      await comp.ngOnInit();
      await wait();

      // Assert
      expect(comp.recipe).toBeDefined();
      expect(comp.recipe!.comments!.length).toBe(0);
    });

    it('C3-T2: no hay error; la carga fue exitosa', async () => {
      // Arrange
      const { comp } = await buildComponent('r1', { recipe: RECIPE_NO_COMMENTS });

      // Act
      await comp.ngOnInit();
      await wait();

      // Assert
      expect(comp.error).toBeNull();
    });
  });

  // ── ⛔ Bugs documentados ─────────────────────────────────────────────────
  describe('⛔ Fallos esperados (bugs en el código)', () => {

    it('⛔ F1: sin id en URL debería redirigir a /home pero NO lo hace [Mock]', async () => {
      // Arrange
      // [MOCK] – la llamada a navigate con ['/home'] es la especificación correcta;
      //          la declaramos antes del Act como contrato esperado
      const { comp, navigateSpy } = await buildComponent(null, { recipe: null });

      // Act
      await comp.ngOnInit();
      await wait();

      // Assert – FALLA: el componente establece error pero no redirige
      expect(navigateSpy).toHaveBeenCalledWith(['/home']);
    });

    it('⛔ F2: receta no encontrada debería mostrar error distinto al de red [Mock]', async () => {
      // Arrange
      // [MOCK] – la expectativa es que el mensaje contenga "problema";
      //          si no, el bug está en que ambos casos usan el mismo texto
      const { comp } = await buildComponent('r1', { recipe: null });

      // Act
      await comp.ngOnInit();
      await wait();

      // Assert – FALLA: el error dice "Es posible que haya sido eliminada",
      //          que no contiene "problema" (camino diferente al de error de red)
      expect(comp.error).toContain('problema');
    });
  });
});
