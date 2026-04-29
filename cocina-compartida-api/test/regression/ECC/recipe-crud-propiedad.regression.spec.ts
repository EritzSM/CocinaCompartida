import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RecipesService } from '../../../src/recipes/recipes.service';
import { Afirmar } from '../../screenplay/fluent/Afirmar';

describe('Recipe CRUD Propiedad Regression Backend', () => {
  let recipe: any;
  let recipeRepo: any;
  let service: RecipesService;

  beforeEach(() => {
    recipe = {
      id: 'r1',
      name: 'Original',
      descripcion: 'Base',
      ingredients: ['a'],
      steps: ['b'],
      category: 'cena',
      user: { id: 'owner' },
    };
    recipeRepo = {
      findOne: jest.fn().mockResolvedValue(recipe),
      save: jest.fn(async (data) => data),
      remove: jest.fn(async () => undefined),
      find: jest.fn(),
      create: jest.fn((data) => data),
    };
    service = new RecipesService(recipeRepo, { find: jest.fn(), findOne: jest.fn() } as any);
  });

  it('Dado el duenio, cuando edita receta, entonces conserva propiedad y actualiza datos', async () => {
    const result = await service.update('r1', { name: 'Editada', category: 'almuerzo' }, { id: 'owner' } as any);

    Afirmar.que(result.name).esIgualA('Editada');
    Afirmar.que(result.category).esIgualA('almuerzo');
    Afirmar.que(result.user.id).esIgualA('owner');
  });

  it('Dado un usuario ajeno, cuando edita receta, entonces lanza Forbidden', async () => {
    await Afirmar.que(service.update('r1', { name: 'Hack' }, { id: 'intruder' } as any)).rechazaCon(ForbiddenException);
  });

  it('Dado el duenio, cuando borra receta, entonces llama remove', async () => {
    await service.remove('r1', { id: 'owner' } as any);

    Afirmar.que(recipeRepo.remove).fueLlamadoCon(recipe);
  });

  it('Dado una receta inexistente, cuando se borra, entonces lanza NotFound', async () => {
    recipeRepo.findOne.mockResolvedValue(null);

    await Afirmar.que(service.remove('no-existe', { id: 'owner' } as any)).rechazaCon(NotFoundException);
  });

  it('Dado un PATCH limpio (sin user en el body), cuando se aplica, entonces el dueno se preserva', async () => {
    const result = await service.update('r1', { name: 'Limpio' }, { id: 'owner' } as any);

    Afirmar.que(result.user.id).esIgualA('owner');
  });

  // ---------------------------------------------------------------------
  // HALLAZGO DE SEGURIDAD documentado (B3 / R8 del segundo concepto)
  //
  // El service hace `Object.assign(recipe, updateRecipeDto)` sin filtrar
  // propiedades. Como `UpdateRecipeDto extends PartialType(CreateRecipeDto)`
  // no incluye `user`, pero `class-validator` por defecto NO descarta
  // propiedades extra (requiere ValidationPipe con `whitelist: true,
  // forbidNonWhitelisted: true` en main.ts), un cliente puede enviar
  // un body con `user: {...}` y el Object.assign reasignara el dueno.
  //
  // Este test deja documentado el comportamiento ACTUAL (riesgoso) sin
  // tocar codigo productivo. Cuando se endurezca, este toBe cambia a 'owner'.
  // ---------------------------------------------------------------------
  it('HALLAZGO: hoy un body con user puede reasignar el duenio (mass-assignment) - documentar y endurecer en produccion', async () => {
    const result = await service.update(
      'r1',
      { name: 'Hack', user: { id: 'intruder' } } as any,
      { id: 'owner' } as any,
    );

    Afirmar.que(result.user.id).esIgualA('intruder');
  });
});
