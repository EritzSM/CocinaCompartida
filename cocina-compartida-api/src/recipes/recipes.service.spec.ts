import { Test, TestingModule } from '@nestjs/testing';
import { RecipesService } from './recipes.service';

describe('Servicio de Recetas', () => {
  let service: RecipesService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn((input) => input),
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipesService,
        {
          provide: 'RecipesRepository',
          useValue: mockRepo,
        },
      ],
    })
      .overrideProvider(RecipesService)
      .useValue(new RecipesService(mockRepo, null)) // constructor doesn't need other repos here
      .compile();

    service = module.get<RecipesService>(RecipesService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  // --- pruebas de subir recetas ---
  it('crea una receta con likes=0 y likedBy vacío', async () => {
    const dto: any = { name: 'Torta', descripcion: 'dulce' };
    const user: any = { id: 'u1' };
    mockRepo.save.mockResolvedValue({ ...dto, user, likes: 0, likedBy: [] });

    const result = await service.create(dto, user);
    expect(mockRepo.create).toHaveBeenCalledWith({ ...dto, user, likes: 0, likedBy: [] });
    expect(mockRepo.save).toHaveBeenCalled();
    expect(result.likes).toBe(0);
    expect(result.likedBy).toEqual([]);
  });

  it('preserva las propiedades del DTO al crear', async () => {
    const dto: any = { name: 'Pizza', descripcion: 'salada', images: ['i1.jpg'] };
    const user: any = { id: 'u2' };
    mockRepo.save.mockResolvedValue({ id: 'r1', ...dto, user, likes: 0, likedBy: [] });

    const recipe = await service.create(dto, user);
    expect(recipe.id).toBe('r1');
    expect(recipe.images).toEqual(['i1.jpg']);
  });

  it('ignora campos likes/likedBy enviados en el DTO', async () => {
    const dto: any = { name: 'Test', likes: 100, likedBy: ['x'] };
    const user: any = { id: 'u3' };
    mockRepo.save.mockResolvedValue({ id: 'r2', ...dto, user, likes: 0, likedBy: [] });

    const res = await service.create(dto, user);
    expect(res.likes).toBe(0);
    expect(res.likedBy).toEqual([]);
  });

  it('asigna el objeto user correctamente', async () => {
    const dto: any = { name: 'U' };
    const user: any = { id: 'userA', username: 'A' };
    mockRepo.save.mockResolvedValue({ id: 'r3', ...dto, user, likes: 0, likedBy: [] });

    const res = await service.create(dto, user);
    expect(res.user).toBe(user);
  });

  it('permite listas de ingredientes y pasos', async () => {
    const dto: any = { name: 'List', ingredients: ['a'], steps: ['b'] };
    const user: any = { id: 'u5' };
    mockRepo.save.mockResolvedValue({ id: 'r8', ...dto, user, likes: 0, likedBy: [] });
    const res = await service.create(dto, user);
    expect(res.ingredients).toEqual(['a']);
    expect(res.steps).toEqual(['b']);
  });

  it('lanza error si no se entrega dto', async () => {
    // @ts-ignore intención de llamar con valores incorrectos
    mockRepo.save.mockRejectedValue(new Error('cannot read property'));
    await expect(service.create(null, { id: 'x' } as any)).rejects.toThrow();
  });

  it('crea ignorando campos extra del DTO', async () => {
    const dto: any = { name: 'Extra', foo: 'bar' };
    const user: any = { id: 'u7' };
    mockRepo.save.mockResolvedValue({ id: 'r9', ...dto, user, likes: 0, likedBy: [] });
    const res = await service.create(dto, user);
    expect(res.foo).toBe('bar');
  });


  it('toggleLike agrega usuario cuando no estaba en likedBy', async () => {
    const recipe: any = { id: 'r1', likedBy: [], likes: 0 };
    mockRepo.findOne.mockResolvedValue({ ...recipe });
    mockRepo.save.mockImplementation(async (r) => r);

    const result = await service.toggleLike('r1', { id: 'u1' } as any);
    expect(result.likes).toBe(1);
    expect(result.likedBy).toEqual(['u1']);
  });

  it('toggleLike elimina usuario cuando ya estaba', async () => {
    const recipe: any = { id: 'r2', likedBy: ['u1'], likes: 1 };
    mockRepo.findOne.mockResolvedValue({ ...recipe });
    mockRepo.save.mockImplementation(async (r) => r);

    const result = await service.toggleLike('r2', { id: 'u1' } as any);
    expect(result.likes).toBe(0);
    expect(result.likedBy).toEqual([]);
  });

  it('toggleLike inicializa likedBy si no es arreglo', async () => {
    const recipe: any = { id: 'r3', likedBy: null, likes: 0 };
    mockRepo.findOne.mockResolvedValue({ ...recipe });
    mockRepo.save.mockImplementation(async (r) => r);

    const result = await service.toggleLike('r3', { id: 'uX' } as any);
    expect(Array.isArray(result.likedBy)).toBe(true);
    expect(result.likes).toBe(1);
  });

  it('toggleLike incrementa contador de likes correctamente', async () => {
    const recipe: any = { id: 'r4', likedBy: ['a','b'], likes: 2 };
    mockRepo.findOne.mockResolvedValue({ ...recipe });
    mockRepo.save.mockImplementation(async (r) => r);

    const result = await service.toggleLike('r4', { id: 'c' } as any);
    expect(result.likes).toBe(3);
  });

  it('toggleLike decrementa contador de likes correctamente', async () => {
    const recipe: any = { id: 'r5', likedBy: ['u1','u2'], likes: 2 };
    mockRepo.findOne.mockResolvedValue({ ...recipe });
    mockRepo.save.mockImplementation(async (r) => r);

    const result = await service.toggleLike('r5', { id: 'u2' } as any);
    expect(result.likes).toBe(1);
  });

  it('toggleLike no duplica usuario si se llama varias veces seguidas', async () => {
    const recipe: any = { id: 'r6', likedBy: [], likes: 0 };
    mockRepo.findOne.mockResolvedValue({ ...recipe });
    mockRepo.save.mockImplementation(async (r) => r);

    await service.toggleLike('r6', { id: 'uZ' } as any);
    const result2 = await service.toggleLike('r6', { id: 'uZ' } as any);
    expect(result2.likedBy).toEqual([]);
    expect(result2.likes).toBe(0);
  });

  it('toggleLike propaga errores de save', async () => {
    mockRepo.findOne.mockResolvedValue({ id: 'r7', likedBy: [], likes: 0 });
    mockRepo.save.mockRejectedValue(new Error('savefail'));
    await expect(service.toggleLike('r7', { id: 'u1' } as any)).rejects.toThrow('savefail');
  });

  it('toggleLike lanza NotFoundException si findOne no encuentra', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    await expect(service.toggleLike('nope', { id: 'u1' } as any)).rejects.toThrow();
  });

});
