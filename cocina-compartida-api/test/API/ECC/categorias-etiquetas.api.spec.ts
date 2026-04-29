import { RecipesService } from '../../../src/recipes/recipes.service';
import { Actor } from '../../screenplay/actor/Actor';
import { Afirmar } from '../../screenplay/fluent/Afirmar';

describe('Categorias y Etiquetas API Backend - Patron Screenplay', () => {
  let service: RecipesService;
  let recipeRepo: { find: jest.Mock; create: jest.Mock; save: jest.Mock; findOne: jest.Mock };
  let commentRepo: { find: jest.Mock; findOne: jest.Mock };

  beforeEach(() => {
    recipeRepo = {
      find: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn(async (data) => ({ id: data.id ?? 'r-new', ...data })),
      findOne: jest.fn(),
    };
    commentRepo = { find: jest.fn(), findOne: jest.fn() };
    service = new RecipesService(recipeRepo as any, commentRepo as any);
  });

  it('Dado una receta con categoria, cuando se crea, entonces conserva la clasificacion', async () => {
    const cocinero = Actor.llamado('Cocinero');
    const user = { id: 'u1', username: 'chef' } as any;
    const dto = { name: 'Huevos', descripcion: 'Desayuno', ingredients: ['huevo'], steps: ['freir'], category: 'desayuno' };

    const resultado = await cocinero.intentar(async () => service.create(dto, user));

    Afirmar.que(recipeRepo.create).fueLlamado();
    Afirmar.que(resultado.category).esIgualA('desayuno');
  });

  it('Dado recetas etiquetadas, cuando se filtra por tag, entonces retorna solo coincidencias', async () => {
    const visitante = Actor.llamado('Visitante');
    const recetas = [
      { id: 'r1', tags: ['desayuno'], category: 'desayuno' },
      { id: 'r2', tags: ['cena'], category: 'cena' },
    ];
    recipeRepo.find.mockResolvedValue(recetas);

    const resultado = await visitante.intentar(async () => service.findByTag('desayuno'));

    Afirmar.que(recipeRepo.find).fueLlamado();
    Afirmar.que(resultado).esEquivalenteA([recetas[0]]);
  });
});
