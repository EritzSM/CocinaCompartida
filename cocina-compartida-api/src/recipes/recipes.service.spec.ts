import { Test, TestingModule } from '@nestjs/testing';
import { RecipesService } from './recipes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Recipe } from './entities/recipe.entity';
import { Comment } from './entities/comment.entity';
import { Repository } from 'typeorm';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { User } from '../user/entities/user.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { validate } from 'class-validator';

describe('RecipesService (Backend Create/Update Tests)', () => {
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

  // B-R01: Crear receta con datos válidos persiste en DB y retorna 201 (O el equivalente objeto en el servicio)
  // Uso de Test Double: Mock (preparando receta devuelta por create/save)
  describe('B-R01', () => {
    it('Crear receta con datos válidos persiste en DB', async () => {
      // Arrange
      const user = { id: 'user-1' } as User;
      const dto: CreateRecipeDto = {
        name: 'Pastel',
        descripcion: 'Delicioso',
        ingredients: ['Harina'],
        steps: ['Mezclar'],
      };
      
      const savedRecipe = { id: 'recipe-1', ...dto, user, likes: 0, likedBy: [] } as Recipe;
      
      // Mock
      (recipeRepository.create as jest.Mock).mockReturnValue(savedRecipe);
      (recipeRepository.save as jest.Mock).mockResolvedValue(savedRecipe);

      // Act
      const result = await service.create(dto, user);

      // Assert
      expect(recipeRepository.create).toHaveBeenCalledWith({
        ...dto,
        user,
        likes: 0,
        likedBy: []
      });
      expect(recipeRepository.save).toHaveBeenCalledWith(savedRecipe);
      expect(result).toEqual(savedRecipe);
    });
  });

  // B-R02: DTO inválido es rechazado por validation pipe
  // Uso de Test Double: Dummy (Objeto vacío para fallar la validación real del class-validator)
  describe('B-R02', () => {
    it('DTO inválido es rechazado por validation pipe', async () => {
      // Arrange
      // Dummy: DTO sin campos requeridos
      const dummyDto = new CreateRecipeDto();
      
      // Act
      const errors = await validate(dummyDto);

      // Assert
      // Debe haber múltiples errores porque faltan los campos
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.map(err => err.property)).toEqual(
        expect.arrayContaining(['name', 'descripcion', 'ingredients', 'steps'])
      );
    });
  });

  // B-R03: update() lanza 404 si la receta no existe
  // Uso de Test Double: Stub (findOne retorna null incondicionalmente)
  describe('B-R03', () => {
    it('update() lanza 404 si la receta no existe', async () => {
      // Arrange
      const updateDto: UpdateRecipeDto = { name: 'Pastel de Chocolate' };
      const user = { id: 'user-1' } as User;
      
      // Stub
      (recipeRepository.findOne as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.update('no-existe', updateDto, user)).rejects.toThrow(NotFoundException);
    });
  });

  // B-R04: update() lanza 403 si el usuario no es el dueño
  // Uso de Test Double: Fake (Usuario diferente fingiendo ser dueño)
  describe('B-R04', () => {
    it('update() lanza 403 si el usuario no es el dueño', async () => {
      // Arrange
      const updateDto: UpdateRecipeDto = { name: 'Pastel de Chocolate' };
      // Fake requester
      const requesterUser = { id: 'intruder' } as User;
      
      // Mock db response
      const existingRecipe = { id: 'recipe-1', user: { id: 'real-owner' } } as Recipe;
      (recipeRepository.findOne as jest.Mock).mockResolvedValue(existingRecipe);

      // Act & Assert
      await expect(service.update('recipe-1', updateDto, requesterUser)).rejects.toThrow(ForbiddenException);
    });
  });

  // B-R05: update() exitoso aplica cambios y retorna 200 (equivalente a Recipe)
  // Uso de Test Double: Spy (Observar que repository.save se haya llamado de facto)
  describe('B-R05', () => {
    it('update() exitoso aplica cambios y retorna modificado', async () => {
      // Arrange
      const updateDto: UpdateRecipeDto = { name: 'Pastel Editado' };
      const ownerUser = { id: 'owner' } as User;
      
      const existingRecipe = { id: 'recipe-1', name: 'Original', user: ownerUser } as Recipe;
      (recipeRepository.findOne as jest.Mock).mockResolvedValue(existingRecipe);
      
      // Hacemos que save retorne lo que se le pasó (ya con el Object.assign aplicado que hace el servicio)
      (recipeRepository.save as jest.Mock).mockImplementation((rec) => Promise.resolve(rec));
      
      // Spy sobre save
      const saveSpy = jest.spyOn(recipeRepository, 'save');

      // Act
      const result = await service.update('recipe-1', updateDto, ownerUser);

      // Assert
      // Verificamos que se haya aplicado el cambio (Object.assign)
      expect(result.name).toBe('Pastel Editado');
      // Verificamos que el espía haya registrado la llamada con el objeto mutado
      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Pastel Editado' })
      );
    });
  });

  // ----------------------------------------------------------------------
  // Toggle Like Tests (B-TL01 a B-TL06)
  // ----------------------------------------------------------------------

  // B-TL01: Receta no encontrada lanza NotFoundException
  // Uso de Test Double: Stub (Retorna null incondicionalmente simulando ausencia en la BD)
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
  // Uso de Test Double: Dummy (Un mock de la receta cuyo prop likedBy no está definido intencionalmente)
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
  // Uso de Test Double: Fake (Generamos un id ajeno simulando a alguien que nunca dio like)
  describe('B-TL03', () => {
    it('Usuario que no ha dado like -> se añade a likedBy y likes++', async () => {
      // Arrange
      const fakeNewUser = { id: 'newUser' } as User;
      const existingRecipe = { id: 'r2', likes: 1, likedBy: ['otherUser'] } as Recipe;
      
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
  // Uso de Test Double: Mock (Validamos el removal explícito asertando que ya no esté en la coleccion)
  describe('B-TL04', () => {
    it('Usuario que ya dio like -> se quita de likedBy y likes--', async () => {
      // Arrange
      const returningUser = { id: 'oldUser' } as User;
      const existingRecipe = { id: 'r3', likes: 1, likedBy: ['oldUser'] } as Recipe;
      
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
  // Uso de Test Double: Spy (Observamos la consistencia del objeto final mandado a guardar)
  describe('B-TL05', () => {
    it('likes siempre es igual a likedBy.length tras la operación', async () => {
      // Arrange
      const user = { id: 'u1' } as User;
      const existingRecipe = { id: 'r4', likes: 5, likedBy: ['u2', 'u3'] } as Recipe; // Inconsistente a propósito al inicio (5 != 2)
      
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
  // Uso de Test Double: Mock (Aseguramos que el retorno contenga las llaves estructuradas)
  describe('B-TL06', () => {
    it('Retorna { likes, likedBy } de forma correcta', async () => {
      // Arrange
      const user = { id: 'u1' } as User;
      const existingRecipe = { id: 'r5', likes: 0, likedBy: [] } as Recipe;
      
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
