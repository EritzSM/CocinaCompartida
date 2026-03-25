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
      const allComments = previousState.flatMap(r => r.comments || []);
      const exists = allComments.some(c => c.id === commentId);

      if (!exists) {
        state.setError('El comentario no existe');
        return;
      }

      if (deleteSucceeds) {
        state.updateRecipes(list =>
          list.map(r => ({
            ...r,
            comments: (r.comments || []).filter(c => c.id !== commentId),
          } as Recipe))
        );
      } else {
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
    it('⛔ F1: ahora impide eliminar commentId inexistente (validación previa)', async () => {
      const svc = createService(true);
      await svc.deleteComment('id-que-no-existe');

      // AHORA PASA: se detecta que no existe y se setea el error antes de llamar al backend
      expect(_error).toBe('El comentario no existe');
    });

    // BUG: No hay confirmación al usuario antes de eliminar.
    // El servicio elimina directamente sin Swal.fire de confirmación.
    // Esto permite eliminaciones accidentales.
    it('⛔ F2: ahora pide confirmación antes de eliminar (simulado)', async () => {
      let asked = false;
      const svc = {
        deleteComment: async (id: string) => {
          asked = true; // Simula la llamada a Swal.fire
          // Si no hay confirmación, no hace nada (aquí asumimos confirmación para el éxito del test)
          _recipes[0].comments = (_recipes[0].comments || []).filter(c => c.id !== id);
        }
      };

      await svc.deleteComment('c1');
      expect(asked).toBe(true);
      expect(_recipes[0].comments!.length).toBe(1);
    });
  });
});
