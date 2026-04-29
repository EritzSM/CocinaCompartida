import { Test } from '@nestjs/testing';
import { INestApplication, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { RecipesController } from '../../../src/recipes/recipes.controller';
import { RecipesService } from '../../../src/recipes/recipes.service';
import { AuthGuard } from '../../../src/security/auth.guard';
import { RecipeOwnerGuard } from '../../../src/security/recipe-owner.guard';
import { Actor } from '../../screenplay/actor/Actor';
import { ConsumeApi } from '../../screenplay/abilities/ConsumeApi';
import { Afirmar } from '../../screenplay/fluent/Afirmar';
import { ListarRecetas } from '../../screenplay/tasks/recipes/ListarRecetas';

/**
 * E2E HTTP real (in-process) — Explorar recetas.
 *
 * A diferencia del *.api.spec.ts (unit del controller), aqui se levanta una
 * INestApplication, supertest pega contra HTTP real y se valida codigo de
 * estado, contrato JSON y ruteo. Usa Actor + ConsumeApi + tarea Screenplay
 * existente (ListarRecetas) para cumplir el patron completo.
 */
describe('Explorar Recetas E2E HTTP - Patron Screenplay completo', () => {
  let app: INestApplication;
  let serviceMock: any;
  let visitante: Actor;

  beforeAll(async () => {
    serviceMock = {
      findAll: jest.fn(),
      findTopLiked: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [RecipesController],
      providers: [{ provide: RecipesService, useValue: serviceMock }],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          throw new UnauthorizedException('No deberia exigir auth en GET /recipes');
        },
      })
      .overrideGuard(RecipeOwnerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    visitante = Actor.llamado('Visitante').con(ConsumeApi.usando(app));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    serviceMock.findAll.mockReset();
    serviceMock.findTopLiked.mockReset();
  });

  it('Dado recetas publicadas, cuando un visitante consulta GET /recipes, entonces recibe 200 y la lista', async () => {
    const recetas = [
      { id: 'r1', name: 'Arepa', descripcion: 'Mañanera', ingredients: ['masa'], steps: ['armar'], category: 'desayuno', user: { id: 'u1', username: 'chef' }, likes: 3, likedBy: [] },
      { id: 'r2', name: 'Sopa', descripcion: 'Caliente', ingredients: ['agua'], steps: ['hervir'], category: 'cena', user: { id: 'u2', username: 'chef2' }, likes: 1, likedBy: [] },
    ];
    serviceMock.findAll.mockResolvedValue(recetas);

    const respuesta = await visitante.intentar(ListarRecetas.ahora());

    Afirmar.que(respuesta.status).esIgualA(200);
    Afirmar.que(respuesta.body).esEquivalenteA(recetas);
    expect(serviceMock.findAll).toHaveBeenCalledTimes(1);
  });

  it('Dado el endpoint publico, cuando se consulta GET /recipes sin token, entonces NO responde 401', async () => {
    serviceMock.findAll.mockResolvedValue([]);

    const respuesta = await visitante.intentar(ListarRecetas.ahora());

    expect(respuesta.status).not.toBe(401);
    Afirmar.que(respuesta.status).esIgualA(200);
  });

  it('Dado el ranking publico, cuando se consulta GET /recipes/top-liked, entonces responde 200 con la lista ordenada', async () => {
    const top = [
      { id: 'r3', name: 'Top1', descripcion: '', ingredients: ['x'], steps: ['y'], likes: 10, likedBy: [], user: { id: 'u' } },
    ];
    serviceMock.findTopLiked.mockResolvedValue(top);

    const ability = visitante.usar<ConsumeApi>(ConsumeApi.CLAVE);
    const r = await ability.get('/recipes/top-liked');

    Afirmar.que(r.status).esIgualA(200);
    Afirmar.que(r.body).esEquivalenteA(top);
  });
});
