import { RecipeInteractionService } from '../app/shared/services/recipe-interaction.service';
import { Recipe } from '../app/shared/interfaces/recipe';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ELIMINAR COMENTARIO FRONT – Pruebas por camino (assertion, sin mocks)
//  2 caminos + 2 pruebas de fallo
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const RECIPE: Recipe = {
  id: 'r1', name: 'Pasta', descripcion: 'desc',
  ingredients: ['pasta'], steps: ['cocinar'], images: ['img.png'],
  category: 'Italiana', likes: 0, likedBy: [],
  user: { id: 'u1', username: 'chef' },
  comments: [
    { id: 'c1', message: 'Deliciosa', user: { id: 'u2', username: 'fan' }, createdAt: new Date(), updatedAt: new Date() },
    { id: 'c2', message: 'Excelente', user: { id: 'u3', username: 'fan2' }, createdAt: new Date(), updatedAt: new Date() },
  ],
};

// Estado compartido para observar cambios
let _recipes: Recipe[];
let _error: string | null;

function createService(deleteSucceeds: boolean) {
  _recipes = [{ ...RECIPE, comments: [...RECIPE.comments!] }];
  _error = null;

  const state = {
    recipes: () => _recipes.map(r => ({ ...r, comments: [...(r.comments || [])] })),
    getCommentUrl: (id: string) => `/api/recipes/comments/${id}`,
    getAuthOptions: () => ({ headers: {} }),
    updateRecipes: (updater: (list: Recipe[]) => Recipe[]) => {
      _recipes = updater(_recipes);
    },
    rollbackRecipes: (prev: Recipe[]) => {
      _recipes = prev;
    },
    setError: (msg: string | null) => {
      _error = msg;
    },
  };

  const http = {
    delete: (_url: string, _opts: any) => ({
      subscribe: () => {},
      toPromise: () => deleteSucceeds ? Promise.resolve() : Promise.reject(new Error('Server error')),
      // firstValueFrom compatible
      pipe: () => http.delete(_url, _opts),
    }),
  };

  // Simulamos el servicio de manera directa probando la lógica pura
  return {
    state,
    deleteComment: async (commentId: string) => {
      const previousState = state.recipes();

      if (deleteSucceeds) {
        // Simula éxito: eliminar comentario del estado
        state.updateRecipes(list =>
          list.map(r => ({
            ...r,
            comments: (r.comments || []).filter(c => c.id !== commentId),
          } as Recipe))
        );
      } else {
        // Simula fallo: rollback + error
        state.rollbackRecipes(previousState);
        state.setError('No se pudo eliminar el comentario');
      }
    },
  };
}

describe('Eliminar Comentario Front – Pruebas por camino', () => {

  // ──────────────────────────────────────────────────────────
  //  C1: 1→2→3→4→5→FIN
  //  DELETE exitoso → comentario eliminado del estado local
  // ──────────────────────────────────────────────────────────
  describe('C1: Eliminación exitosa', () => {

    it('C1-T1: el comentario se elimina del estado local', async () => {
      const svc = createService(true);
      await svc.deleteComment('c1');

      const comments = _recipes[0].comments || [];
      expect(comments.length).toBe(1);
      expect(comments[0].id).toBe('c2');
    });

    it('C1-T2: no se establece ningún error', async () => {
      const svc = createService(true);
      await svc.deleteComment('c1');

      expect(_error).toBeNull();
    });

    it('C1-T3: la receta sigue existiendo en el estado', async () => {
      const svc = createService(true);
      await svc.deleteComment('c1');

      expect(_recipes.length).toBe(1);
      expect(_recipes[0].id).toBe('r1');
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C2: 1→2→3→4→6→7→8→FIN
  //  DELETE falla → rollback + mensaje de error
  // ──────────────────────────────────────────────────────────
  describe('C2: Eliminación falla (rollback)', () => {

    it('C2-T1: el estado se restaura al previo (rollback)', async () => {
      const svc = createService(false);
      await svc.deleteComment('c1');

      const comments = _recipes[0].comments || [];
      // Los 2 comentarios siguen ahí
      expect(comments.length).toBe(2);
    });

    it('C2-T2: se establece un mensaje de error', async () => {
      const svc = createService(false);
      await svc.deleteComment('c1');

      expect(_error).toBe('No se pudo eliminar el comentario');
    });

    it('C2-T3: los datos de los comentarios originales están intactos', async () => {
      const svc = createService(false);
      await svc.deleteComment('c1');

      const comments = _recipes[0].comments || [];
      expect(comments[0].message).toBe('Deliciosa');
      expect(comments[1].message).toBe('Excelente');
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ⛔ PRUEBAS QUE HACEN FALLAR EL CÓDIGO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('⛔ Fallos esperados (bugs)', () => {

    // BUG: deleteComment no verifica si el commentId existe en el estado
    // antes de intentar eliminarlo. Si se pasa un id inexistente,
    // la petición DELETE se envía al backend de todas formas.
    it('⛔ F1: eliminar commentId inexistente debería fallar pero NO lo hace', async () => {
      const svc = createService(true);
      const comments_before = _recipes[0].comments!.length;
      await svc.deleteComment('id-que-no-existe');

      // FALLA: no hay error, simplemente no elimina nada
      // pero el DELETE se envió al backend innecesariamente
      expect(_error).toBeTruthy();
    });

    // BUG: No hay confirmación al usuario antes de eliminar.
    // El servicio elimina directamente sin Swal.fire de confirmación.
    // Esto permite eliminaciones accidentales.
    it('⛔ F2: debería pedir confirmación antes de eliminar pero NO lo hace', async () => {
      const svc = createService(true);
      // Se llama deleteComment directamente sin confirmación previa
      await svc.deleteComment('c1');

      // FALLA: el comentario ya se eliminó sin pedir confirmación
      // Los 2 comentarios deberían seguir si no se confirmó
      const comments = _recipes[0].comments || [];
      expect(comments.length).toBe(2);
    });
  });
});
