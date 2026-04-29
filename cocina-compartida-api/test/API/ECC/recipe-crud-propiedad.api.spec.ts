import { RecipesController } from '../../../src/recipes/recipes.controller';
import { RecipesService } from '../../../src/recipes/recipes.service';
import { Actor } from '../../screenplay/actor/Actor';
import { Afirmar } from '../../screenplay/fluent/Afirmar';

describe('Recipe CRUD Propiedad API Backend - Patron Screenplay', () => {
  let controller: RecipesController;
  let recipesService: Partial<RecipesService>;
  const user = { id: 'u-owner', username: 'owner' };

  beforeEach(() => {
    recipesService = {
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    controller = new RecipesController(recipesService as RecipesService);
  });

  it('Dado un cocinero autenticado, cuando crea una receta, entonces delega con el usuario autenticado', async () => {
    const cocinero = Actor.llamado('Cocinero');
    const dto = { name: 'Pasta', descripcion: 'Casera', ingredients: ['pasta'], steps: ['cocinar'], category: 'cena' };
    const creada = { id: 'r1', ...dto, user };
    (recipesService.create as jest.Mock).mockResolvedValue(creada);

    const resultado = await cocinero.intentar(async () => controller.create(dto as any, { user }));

    Afirmar.que(recipesService.create).fueLlamadoCon(dto, user);
    Afirmar.que(resultado).esEquivalenteA(creada);
  });

  it('Dado el duenio, cuando edita su receta, entonces delega update con id cambios y usuario', async () => {
    const duenio = Actor.llamado('Duenio');
    const cambios = { name: 'Pasta actualizada', category: 'almuerzo' };
    const actualizada = { id: 'r1', ...cambios, user };
    (recipesService.update as jest.Mock).mockResolvedValue(actualizada);

    const resultado = await duenio.intentar(async () => controller.update('r1', cambios as any, { user }));

    Afirmar.que(recipesService.update).fueLlamadoCon('r1', cambios, user);
    Afirmar.que(resultado).esEquivalenteA(actualizada);
  });

  it('Dado el duenio, cuando borra su receta, entonces delega remove con id y usuario', async () => {
    const duenio = Actor.llamado('Duenio');
    (recipesService.remove as jest.Mock).mockResolvedValue(undefined);

    const resultado = await duenio.intentar(async () => controller.remove('r1', { user }));

    Afirmar.que(recipesService.remove).fueLlamadoCon('r1', user);
    Afirmar.que(resultado).esIndefinido();
  });
});
