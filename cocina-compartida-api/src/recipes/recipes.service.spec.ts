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
      
      const savedRecipe = { id: 'recipe-1', ...dto, user, likes: 0, likedBy: [] } as unknown as Recipe;
      
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

});
