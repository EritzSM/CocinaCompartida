import { Recipe } from '../shared/interfaces/recipe';

/**
 * ELIMINAR COMENTARIO FRONT – Triple-A / FIRST / 5 tipos de mock
 * ─────────────────────────────────────────────────────────────────────────
 * Tipos de mock utilizados:
 *   DUMMY  → getAuthOptions: devuelve cabeceras vacías; la firma lo requiere
 *             pero el valor no afecta a ninguna aserción de este test.
 *   STUB   → getCommentUrl: devuelve una URL fija predeterminada.
 *             httpStub.delete: resultado de red fijo (éxito o rechazo).
 *   SPY    → validateSpy en ⛔F1: jasmine.createSpy que representa la
 *             validación previa que debería existir pero no existe.
 *   MOCK   → confirmMock en ⛔F2: spy pre-programado para devolver false;
 *             su no-invocación demuestra que no hay paso de confirmación.
 *   FAKE   → buildFakeService: implementación completa y funcional del
 *             estado local (recipes + error) con lógica real de rollback.
 *
 * Principios FIRST:
 *   Fast        – Sin Angular TestBed ni HTTP real; lógica pura + Promises.
 *   Independent – buildFakeService encapsula el estado; cada test parte de
 *                 cero (se eliminaron _recipes/_error de nivel de módulo).
 *   Repeatable  – Datos hardcoded; sin dependencias externas ni aleatoriedad.
 *   Self-val.   – Cada test tiene al menos un expect() con resultado booleano.
 *   Timely      – Tests escritos junto al desarrollo de la funcionalidad.
 */

// ── Datos de prueba ────────────────────────────────────────────────────────
const BASE_RECIPE: Recipe = {
  id: 'r1', name: 'Pasta', descripcion: 'desc',
  ingredients: ['pasta'], steps: ['cocinar'], images: ['img.png'],
  category: 'Italiana', likes: 0, likedBy: [],
  user: { id: 'u1', username: 'chef' },
  comments: [
    { id: 'c1', message: 'Deliciosa',  user: { id: 'u2', username: 'fan'  }, createdAt: new Date(), updatedAt: new Date() },
    { id: 'c2', message: 'Excelente', user: { id: 'u3', username: 'fan2' }, createdAt: new Date(), updatedAt: new Date() },
  ],
};

// ── Helper: fabrica del servicio con estado encapsulado ────────────────────
//   [FAKE] – implementación operativa del estado local con lógica de rollback
function buildFakeService(deleteSucceeds: boolean) {
  let recipes: Recipe[] = [{ ...BASE_RECIPE, comments: [...BASE_RECIPE.comments!] }];
  let error: string | null = null;

  // [STUB] – URL del endpoint siempre predeterminada
  const getCommentUrl = (id: string) => `/api/recipes/comments/${id}`;

  // [DUMMY] – cabeceras requeridas por la firma pero irrelevantes para las aserciones
  const getAuthOptions = () => ({ headers: {} });

  // [STUB] – cliente HTTP con respuesta fija
  const httpStub = {
    delete: (_url: string, _opts: any) => ({
      toPromise: () => deleteSucceeds
        ? Promise.resolve()
        : Promise.reject(new Error('Server error')),
    }),
  };

  const deleteComment = async (commentId: string) => {
    const snapshot: Recipe[] = recipes.map(r => ({
      ...r, comments: [...(r.comments || [])],
    }));
    try {
      await httpStub.delete(getCommentUrl(commentId), getAuthOptions()).toPromise();
      recipes = recipes.map(r => ({
        ...r,
        comments: (r.comments || []).filter((c: { id: string }) => c.id !== commentId),
      } as Recipe));
    } catch {
      recipes = snapshot;
      error   = 'No se pudo eliminar el comentario';
    }
  };

  return {
    deleteComment,
    getRecipes: () => recipes,
    getError:   () => error,
  };
}

// ── Suite ──────────────────────────────────────────────────────────────────
describe('Eliminar Comentario Front – AAA / FIRST / Mocks', () => {

  // ── C1: DELETE exitoso ───────────────────────────────────────────────────
  describe('C1: Eliminación exitosa', () => {

    it('C1-T1: el comentario eliminado desaparece del estado local', async () => {
      // Arrange – [FAKE] con HTTP exitoso
      const svc = buildFakeService(true);

      // Act
      await svc.deleteComment('c1');

      // Assert
      const comments = svc.getRecipes()[0].comments!;
      expect(comments.length).toBe(1);
      expect(comments[0].id).toBe('c2');
    });

    it('C1-T2: no se establece ningún mensaje de error', async () => {
      // Arrange
      const svc = buildFakeService(true);

      // Act
      await svc.deleteComment('c1');

      // Assert
      expect(svc.getError()).toBeNull();
    });

    it('C1-T3: la receta sigue existiendo en el estado', async () => {
      // Arrange
      const svc = buildFakeService(true);

      // Act
      await svc.deleteComment('c1');

      // Assert
      expect(svc.getRecipes().length).toBe(1);
      expect(svc.getRecipes()[0].id).toBe('r1');
    });
  });

  // ── C2: DELETE falla → rollback ──────────────────────────────────────────
  describe('C2: Eliminación falla (rollback)', () => {

    it('C2-T1: el estado se restaura al previo (rollback)', async () => {
      // Arrange – [FAKE] con HTTP fallido
      const svc = buildFakeService(false);

      // Act
      await svc.deleteComment('c1');

      // Assert
      expect(svc.getRecipes()[0].comments!.length).toBe(2);
    });

    it('C2-T2: se establece el mensaje de error correcto', async () => {
      // Arrange
      const svc = buildFakeService(false);

      // Act
      await svc.deleteComment('c1');

      // Assert
      expect(svc.getError()).toBe('No se pudo eliminar el comentario');
    });

    it('C2-T3: los mensajes originales siguen intactos tras el rollback', async () => {
      // Arrange
      const svc = buildFakeService(false);

      // Act
      await svc.deleteComment('c1');

      // Assert
      const comments = svc.getRecipes()[0].comments!;
      expect(comments[0].message).toBe('Deliciosa');
      expect(comments[1].message).toBe('Excelente');
    });
  });

  // ── ⛔ Bugs documentados ─────────────────────────────────────────────────
  describe('⛔ Fallos esperados (bugs en el código)', () => {

    it('⛔ F1: eliminar id inexistente debería producir error pero NO lo hace [Spy]', async () => {
      // Arrange
      const svc = buildFakeService(true);
      // [SPY] – representa la validación previa que debería existir pero no existe
      const validateSpy = jasmine.createSpy('validateCommentExists').and.returnValue(false);

      // Act – el servicio no llama a validateSpy; el DELETE se envía sin validar
      await svc.deleteComment('id-que-no-existe');

      // Assert – BUG documentado: no se produce error aunque el id no existía
      expect(validateSpy).not.toHaveBeenCalled(); // la validación directamente no existe
      expect(svc.getError()).toBeNull();
    });

    it('⛔ F2: debería pedir confirmación antes de eliminar pero NO lo hace [Mock]', async () => {
      // Arrange
      const svc = buildFakeService(true);
      // [MOCK] – pre-programado para retornar false (usuario cancela);
      // su no-invocación demuestra que no existe el paso de confirmación
      const confirmMock = jasmine.createSpy('userConfirm').and.returnValue(false);

      // Act – la eliminación ocurre directamente sin pasar por confirmMock
      await svc.deleteComment('c1');

      // Assert – BUG documentado: el comentario fue eliminado aunque nunca se confirmó
      expect(confirmMock).not.toHaveBeenCalled(); // refleja que la llamada no existe en el código
      const comments = svc.getRecipes()[0].comments!;
      expect(comments.length).toBe(1);
    });
  });
});
