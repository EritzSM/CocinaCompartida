import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RecipeOwnerGuard } from '../../../src/security/recipe-owner.guard';
import { RecipesService } from '../../../src/recipes/recipes.service';
import { Afirmar } from '../../screenplay/fluent/Afirmar';

describe('Recipe CRUD Propiedad Security Backend', () => {
  let guard: RecipeOwnerGuard;
  let recipesService: Partial<RecipesService>;

  function context(userId: string | null, recipeId: string | null) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: userId ? { id: userId } : undefined,
          params: recipeId ? { id: recipeId } : {},
        }),
      }),
    } as any;
  }

  beforeEach(() => {
    recipesService = { findOne: jest.fn() };
    guard = new RecipeOwnerGuard(recipesService as RecipesService);
  });

  it('Dado el duenio de una receta, cuando edita o borra, entonces el guard permite la accion', async () => {
    (recipesService.findOne as jest.Mock).mockResolvedValue({ id: 'r1', user: { id: 'u1' } });

    const permitido = await guard.canActivate(context('u1', 'r1'));

    Afirmar.que(recipesService.findOne).fueLlamadoCon('r1');
    Afirmar.que(permitido).esIgualA(true);
  });

  it('Dado un usuario distinto al duenio, cuando intenta modificar receta ajena, entonces recibe Forbidden', async () => {
    (recipesService.findOne as jest.Mock).mockResolvedValue({ id: 'r1', user: { id: 'owner' } });

    await Afirmar.que(guard.canActivate(context('intruder', 'r1'))).rechazaCon(ForbiddenException);
  });

  it('Dado una peticion sin usuario autenticado, cuando se valida propiedad, entonces recibe Forbidden', async () => {
    await Afirmar.que(guard.canActivate(context(null, 'r1'))).rechazaCon(ForbiddenException);
  });

  it('Dado una peticion sin id de receta, cuando se valida propiedad, entonces recibe NotFound', async () => {
    await Afirmar.que(guard.canActivate(context('u1', null))).rechazaCon(NotFoundException);
  });
});
