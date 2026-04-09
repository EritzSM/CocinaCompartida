import { Test, TestingModule } from '@nestjs/testing';
import { RecipesService } from './recipes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Recipe } from './entities/recipe.entity';
import { Comment } from './entities/comment.entity';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { NotFoundException } from '@nestjs/common';

describe('RecipesService (Toggle Like Tests)', () => {
  let service: RecipesService;
  let recipeRepository: Partial<Repository<Recipe>>;
  let commentRepository: Partial<Repository<Comment>>;

  beforeEach(async () => {
    recipeRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
    };

    commentRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipesService,
        {
          provide: getRepositoryToken(Recipe),
          useValue: recipeRepository,
        },
        {
          provide: getRepositoryToken(Comment),
          useValue: commentRepository,
        },
      ],
    }).compile();

    service = module.get<RecipesService>(RecipesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // B-TL01: Receta no encontrada lanza NotFoundException
  // Stub (Retorna null incondicionalmente simulando ausencia en la BD)
  describe('B-TL01', () => {
    it('Receta no encontrada lanza NotFoundException', async () => {
      // Arrange
      const user = { id: 'u1' } as User;
      // Stub
      (recipeRepository.findOne as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.toggleLike('missing-id', user)).rejects.toThrow(NotFoundException);
    });
  });

  // B-TL02: likedBy nulo/indefinido se inicializa como array vacío
  // Dummy (Un mock de la receta cuyo prop likedBy no está definido intencionalmente)
  describe('B-TL02', () => {
    it('likedBy nulo/indefinido se inicializa como array vacío antes de operar', async () => {
      // Arrange
      const user = { id: 'u1' } as User;
      // Dummy field in recipe -> likedBy: undefined
      const recipeDummy = { id: 'r1', likes: 0, likedBy: undefined } as any as Recipe;

      (recipeRepository.findOne as jest.Mock).mockResolvedValue(recipeDummy);
      (recipeRepository.save as jest.Mock).mockImplementation(async (r) => r);

      const saveSpy = jest.spyOn(recipeRepository, 'save');

      // Act
      await service.toggleLike('r1', user);

      // Assert
      // Antes de que el usuario haya hecho push, el array tuvo que inicializarse y luego recibir al usuario.
      // Por ende, el resultado salvado debe tener ['u1']
      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          likedBy: ['u1']
        })
      );
    });
  });

  // B-TL03: Usuario que no ha dado like -> se añade a likedBy y likes++
  // Fake (Generamos un id ajeno simulando a alguien que nunca dio like)
  describe('B-TL03', () => {
    it('Usuario que no ha dado like -> se añade a likedBy y likes++', async () => {
      // Arrange
      const fakeNewUser = { id: 'newUser' } as User;
      const existingRecipe = { id: 'r2', likes: 1, likedBy: ['otherUser'] } as unknown as Recipe;

      (recipeRepository.findOne as jest.Mock).mockResolvedValue(existingRecipe);
      (recipeRepository.save as jest.Mock).mockImplementation(async (r) => r);

      // Act
      const result = await service.toggleLike('r2', fakeNewUser);

      // Assert
      expect(result.likedBy).toContain('newUser');
      expect(result.likes).toBe(2);
    });
  });

  // B-TL04: Usuario que ya dio like -> se quita de likedBy y likes--
  // Mock (Validamos el removal explícito asertando que ya no esté en la coleccion)
  describe('B-TL04', () => {
    it('Usuario que ya dio like -> se quita de likedBy y likes--', async () => {
      // Arrange
      const returningUser = { id: 'oldUser' } as User;
      const existingRecipe = { id: 'r3', likes: 1, likedBy: ['oldUser'] } as unknown as Recipe;

      (recipeRepository.findOne as jest.Mock).mockResolvedValue(existingRecipe);
      (recipeRepository.save as jest.Mock).mockImplementation(async (r) => r);

      // Act
      const result = await service.toggleLike('r3', returningUser);

      // Assert
      expect(result.likedBy).not.toContain('oldUser');
      expect(result.likes).toBe(0);
      expect(result.likedBy.length).toBe(0);
    });
  });

  // B-TL05: likes siempre es igual a likedBy.length tras la operación
  // Spy (Observamos la consistencia del objeto final mandado a guardar)
  describe('B-TL05', () => {
    it('likes siempre es igual a likedBy.length tras la operación', async () => {
      // Arrange
      const user = { id: 'u1' } as User;
      const existingRecipe = { id: 'r4', likes: 5, likedBy: ['u2', 'u3'] } as unknown as Recipe; // Inconsistente a propósito al inicio (5 != 2)

      (recipeRepository.findOne as jest.Mock).mockResolvedValue(existingRecipe);
      (recipeRepository.save as jest.Mock).mockImplementation(async (r) => r);

      const saveSpy = jest.spyOn(recipeRepository, 'save');

      // Act
      await service.toggleLike('r4', user);

      // Assert
      // El espía verifica que la entidad que se grabó corrigió esta inconsistencia
      const savedEntity = saveSpy.mock.calls[0][0] as Recipe;
      expect(savedEntity.likes).toBe(savedEntity.likedBy.length);
      expect(savedEntity.likes).toBe(3); // Eran 2 ['u2', 'u3'] + 1 ['u1'] = 3
    });
  });

  // B-TL06: Retorna { likes, likedBy } correcto (equivalente al success controller/service)
  // Mock (Aseguramos que el retorno contenga las llaves estructuradas)
  describe('B-TL06', () => {
    it('Retorna { likes, likedBy } de forma correcta', async () => {
      // Arrange
      const user = { id: 'u1' } as User;
      const existingRecipe = { id: 'r5', likes: 0, likedBy: [] } as unknown as Recipe;

      (recipeRepository.findOne as jest.Mock).mockResolvedValue(existingRecipe);
      (recipeRepository.save as jest.Mock).mockImplementation(async (r) => r);

      // Act
      const result = await service.toggleLike('r5', user);

      // Assert
      // Debe ser un objecto con properties `likes` y `likedBy` exactas
      expect(result).toHaveProperty('likes');
      expect(result).toHaveProperty('likedBy');
      expect(result).toEqual({
        likes: 1,
        likedBy: ['u1']
      });
    });
  });

});
