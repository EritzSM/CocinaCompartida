import { Test } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import { RecipesController } from '../../../src/recipes/recipes.controller';
import { RecipesService } from '../../../src/recipes/recipes.service';
import { AuthGuard } from '../../../src/security/auth.guard';
import { RecipeOwnerGuard } from '../../../src/security/recipe-owner.guard';
import { Actor } from '../../screenplay/actor/Actor';
import { ConsumeApi } from '../../screenplay/abilities/ConsumeApi';
import { Afirmar } from '../../screenplay/fluent/Afirmar';
import { VerDetalleReceta } from '../../screenplay/tasks/recipes/VerDetalleReceta';

/**
 * E2E HTTP real para el detalle de receta. Levanta un Nest in-process,
 * delega en supertest y usa la tarea VerDetalleReceta (antes huerfana).
 */
describe('Detalle Receta E2E HTTP - Patron Screenplay completo', () => {
  let app: INestApplication;
  let serviceMock: any;
  let visitante: Actor;

  beforeAll(async () => {
    serviceMock = {
      findOne: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [RecipesController],
      providers: [{ provide: RecipesService, useValue: serviceMock }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
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
    serviceMock.findOne.mockReset();
  });

  it('Dado una receta existente, cuando se consulta GET /recipes/:id, entonces responde 200 con nombre, ingredientes, pasos y autor', async () => {
    const receta = {
      id: 'r1',
      name: 'Tortilla',
      descripcion: 'Receta completa',
      ingredients: ['huevo', 'sal'],
      steps: ['batir', 'cocer'],
      category: 'desayuno',
      images: [],
      tags: [],
      likes: 0,
      likedBy: [],
      user: { id: 'u1', username: 'chef' },
      comments: [],
    };
    serviceMock.findOne.mockResolvedValue(receta);

    const respuesta = await visitante.intentar(VerDetalleReceta.conId('r1').ahora());

    Afirmar.que(respuesta.status).esIgualA(200);
    Afirmar.que(respuesta.body).contieneObjeto({
      id: 'r1',
      name: 'Tortilla',
      ingredients: ['huevo', 'sal'],
      steps: ['batir', 'cocer'],
    });
    Afirmar.que(respuesta.body).tienePropiedad('user');
    Afirmar.que(respuesta.body.user.username).esIgualA('chef');
    expect(serviceMock.findOne).toHaveBeenCalledWith('r1');
  });

  it('Dado una receta inexistente, cuando se consulta detalle, entonces responde 404 controlado y no 500', async () => {
    serviceMock.findOne.mockRejectedValue(new NotFoundException('Recipe with ID "no-existe" not found'));

    const respuesta = await visitante.intentar(VerDetalleReceta.conId('no-existe').ahora());

    Afirmar.que(respuesta.status).esIgualA(404);
    expect(respuesta.status).not.toBe(500);
  });
});
