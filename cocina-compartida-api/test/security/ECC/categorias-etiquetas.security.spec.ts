import { RecipesService } from '../../../src/recipes/recipes.service';
import { Afirmar } from '../../screenplay/fluent/Afirmar';

/**
 * Seguridad de categorias y etiquetas.
 *
 * Nota honesta: el filtrado de etiquetas en este service ocurre en memoria
 * (Array.includes), no llega a SQL. Por tanto NO probamos inyeccion SQL aqui
 * (eso debe ir en E2E con DB real). Probamos en su lugar:
 *  - que el filtro publico no requiere ni consume usuario autenticado.
 *  - que entradas inesperadas no rompen el sistema (tolerancia a input).
 *  - que un tag completamente desconocido devuelve resultado vacio determinista.
 */
describe('Categorias y Etiquetas Security Backend', () => {
  it('Dado un filtro publico por tag, cuando se ejecuta, entonces no exige usuario y no muta datos', async () => {
    const recetas = [
      { id: 'r1', tags: ['desayuno'], category: 'desayuno' },
      { id: 'r2', tags: ['cena'], category: 'cena' },
    ];
    const recipeRepo = { find: jest.fn().mockResolvedValue(recetas), findOne: jest.fn(), save: jest.fn() };
    const commentRepo = { find: jest.fn(), findOne: jest.fn() };
    const service = new RecipesService(recipeRepo as any, commentRepo as any);

    const resultado = await service.findByTag('desayuno');

    Afirmar.que(resultado).esEquivalenteA([recetas[0]]);
    Afirmar.que(recipeRepo.find).fueLlamado();
    expect(recipeRepo.save).not.toHaveBeenCalled();
  });

  it('Dado un tag con caracteres inesperados, cuando se filtra en memoria, entonces el sistema retorna vacio sin lanzar error 500', async () => {
    // Aclaracion: este NO es un test de inyeccion SQL - findByTag filtra con
    // Array.includes en memoria. Validamos solamente robustez de input.
    const recipeRepo = {
      find: jest.fn().mockResolvedValue([{ id: 'r1', tags: ['cena'] }]),
      findOne: jest.fn(),
    };
    const commentRepo = { find: jest.fn(), findOne: jest.fn() };
    const service = new RecipesService(recipeRepo as any, commentRepo as any);

    const tagsRaros = ['', '   ', 'tag-con-`backtick`', 'a'.repeat(1024), 'emoji-fuego'];
    for (const t of tagsRaros) {
      const resultado = await service.findByTag(t);
      Afirmar.que(resultado).esEquivalenteA([]);
    }
  });

  it('Dado un tag inexistente, cuando se filtra, entonces retorna lista vacia de manera determinista', async () => {
    const recipeRepo = {
      find: jest.fn().mockResolvedValue([{ id: 'r1', tags: ['cena'] }]),
      findOne: jest.fn(),
    };
    const commentRepo = { find: jest.fn(), findOne: jest.fn() };
    const service = new RecipesService(recipeRepo as any, commentRepo as any);

    const resultado = await service.findByTag('no-existe');

    Afirmar.que(resultado).esEquivalenteA([]);
  });
});
