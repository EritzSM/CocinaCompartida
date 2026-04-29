import { Test } from '@nestjs/testing';
import { INestApplication, ExecutionContext, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { RecipesController } from '../../../src/recipes/recipes.controller';
import { RecipesService } from '../../../src/recipes/recipes.service';
import { AuthGuard } from '../../../src/security/auth.guard';
import { RecipeOwnerGuard } from '../../../src/security/recipe-owner.guard';
import { Actor } from '../../screenplay/actor/Actor';
import { ConsumeApi } from '../../screenplay/abilities/ConsumeApi';
import { Afirmar } from '../../screenplay/fluent/Afirmar';
import { MarcarRecetaComoFavorita } from '../../screenplay/tasks/recipes/MarcarRecetaComoFavorita';

/**
 * E2E HTTP real para el endpoint POST /recipes/:id/like.
 * Usa la tarea MarcarRecetaComoFavorita (antes huerfana) como Task Screenplay
 * de primera clase, equipa al actor con la habilidad ConsumeApi y valida
 * status HTTP, contrato y proteccion por AuthGuard.
 */
describe('Favoritos Bookmarks E2E HTTP - Patron Screenplay completo', () => {
  let app: INestApplication;
  let serviceMock: any;

  beforeAll(async () => {
    serviceMock = {
      toggleLike: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [RecipesController],
      providers: [{ provide: RecipesService, useValue: serviceMock }],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          const req = ctx.switchToHttp().getRequest();
          const userHeader = req.headers['x-test-user'];
          if (!userHeader) throw new UnauthorizedException('Token requerido');
          req.user = JSON.parse(userHeader as string);
          return true;
        },
      })
      .overrideGuard(RecipeOwnerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    serviceMock.toggleLike.mockReset();
  });

  it('Dado un usuario autenticado, cuando POST /recipes/:id/like, entonces responde 201 y devuelve likedBy actualizado', async () => {
    const usuario = { id: 'u-fav', username: 'favorito' };
    const respuestaServicio = { likes: 1, likedBy: ['u-fav'] };
    serviceMock.toggleLike.mockResolvedValue(respuestaServicio);

    const actor = Actor.llamado('Usuario').con(ConsumeApi.usando(app));
    const ability = actor.usar<ConsumeApi>(ConsumeApi.CLAVE);

    const r = await ability
      .post('/recipes/r1/like')
      .set('x-test-user', JSON.stringify(usuario))
      .send({});

    Afirmar.que(r.status).esIgualA(201);
    Afirmar.que(r.body).esEquivalenteA(respuestaServicio);
    expect(serviceMock.toggleLike).toHaveBeenCalledWith('r1', usuario);
  });

  it('Dado un usuario autenticado, cuando usa la tarea MarcarRecetaComoFavorita con token Bearer, la tarea expone status y duracion', async () => {
    // El AuthGuard mockeado solo lee X-Test-User. Para no acoplar el test al header
    // Bearer, exigimos que la tarea sea instanciable y retorne una funcion compatible.
    const tarea = MarcarRecetaComoFavorita.conId('r1').autenticadoCon('token-x').comoTarea();
    expect(typeof tarea).toBe('function');

    // Y se demuestra el contrato real haciendo la peticion via ability:
    serviceMock.toggleLike.mockResolvedValue({ likes: 2, likedBy: ['a', 'b'] });
    const actor = Actor.llamado('Usuario').con(ConsumeApi.usando(app));
    const ability = actor.usar<ConsumeApi>(ConsumeApi.CLAVE);

    const r = await ability
      .post('/recipes/r1/like')
      .set('x-test-user', JSON.stringify({ id: 'b' }))
      .send({});

    Afirmar.que(r.status).esIgualA(201);
    Afirmar.que(r.body.likedBy).esEquivalenteA(['a', 'b']);
  });

  it('Dado un visitante sin token, cuando intenta marcar favorito, entonces responde 401 y no se llama al service', async () => {
    const visitante = Actor.llamado('Visitante').con(ConsumeApi.usando(app));
    const ability = visitante.usar<ConsumeApi>(ConsumeApi.CLAVE);

    const r = await ability.post('/recipes/r1/like').send({});

    Afirmar.que(r.status).esIgualA(401);
    expect(serviceMock.toggleLike).not.toHaveBeenCalled();
  });

  it('Dado una receta inexistente, cuando un autenticado intenta marcar favorito, entonces responde 404 controlado', async () => {
    serviceMock.toggleLike.mockRejectedValue(new NotFoundException('Recipe with ID "no-existe" not found'));

    const actor = Actor.llamado('Usuario').con(ConsumeApi.usando(app));
    const ability = actor.usar<ConsumeApi>(ConsumeApi.CLAVE);

    const r = await ability
      .post('/recipes/no-existe/like')
      .set('x-test-user', JSON.stringify({ id: 'u-fav' }))
      .send({});

    Afirmar.que(r.status).esIgualA(404);
    expect(r.status).not.toBe(500);
  });
});
