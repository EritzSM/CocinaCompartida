/**
 * Recipe CRUD – Pruebas del servicio remove()
 *
 * Tipo de mocks usados en este archivo:
 *   - Mock   : recipeRepo.remove con verificación explícita de llamada
 *   - Dummy  : user object que solo cumple la firma del método, sin lógica propia
 *   - Fake   : fakeUser que simula ser dueño pero tiene ID diferente (usuario impostor)
 */
import { RecipesService } from '../recipes/recipes.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { User } from '../user/entities/user.entity';

describe('RecipesService – Recipe CRUD (remove)', () => {
  let service: RecipesService;
  let recipeRepo: any;
  let commentRepo: any;

  beforeEach(() => {
    // Arrange global
    recipeRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    commentRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    service = new RecipesService(recipeRepo, commentRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────
  // CR-D01: remove lanza 404 si la receta no existe
  // ──────────────────────────────────────────────────────────
  describe('CR-D01 – remove lanza NotFoundException cuando la receta no existe', () => {
    it('debe lanzar NotFoundException y no llamar a remove del repositorio', async () => {
      // Test Double: Dummy + Mock – dummyUser llena la firma + not.toHaveBeenCalled en remove
      // Arrange – Dummy: user solo para cumplir la firma del método
      const dummyUser = { id: 'dummy-user-id' } as User;
      recipeRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove('id-no-existe', dummyUser)).rejects.toThrow(NotFoundException);
      expect(recipeRepo.remove).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────
  // CR-D02: remove lanza 403 si el usuario no es el dueño
  // ──────────────────────────────────────────────────────────
  describe('CR-D02 – remove lanza ForbiddenException cuando el usuario no es el dueño', () => {
    it('debe lanzar ForbiddenException y no eliminar la receta', async () => {
      // Test Double: Fake + Mock – fakeUser simula impostor + not.toHaveBeenCalled en remove
      // Arrange – Fake: usuario que simula ser dueño con ID diferente
      const fakeUser = { id: 'impostor-id', username: 'impostor' } as User;
      const mockRecipe = {
        id: 'recipe-ajena',
        name: 'Receta ajena',
        user: { id: 'dueño-real-id' },
      };
      recipeRepo.findOne.mockResolvedValue(mockRecipe);

      // Act & Assert
      await expect(service.remove('recipe-ajena', fakeUser)).rejects.toThrow(ForbiddenException);
      expect(recipeRepo.remove).not.toHaveBeenCalled();
    });

    it('el mensaje de error debe indicar que solo el dueño puede eliminar', async () => {
      // Test Double: Fake – fakeUser con id diferente al dueño real de la receta
      // Arrange – Fake
      const fakeUser = { id: 'otro-usuario' } as User;
      const mockRecipe = {
        id: 'recipe-x',
        name: 'Mi receta',
        user: { id: 'propietario' },
      };
      recipeRepo.findOne.mockResolvedValue(mockRecipe);

      // Act & Assert
      await expect(service.remove('recipe-x', fakeUser)).rejects.toThrow(
        'You can only delete your own recipes',
      );
    });
  });

  // ──────────────────────────────────────────────────────────
  // CR-D03: remove elimina exitosamente cuando el usuario es dueño
  // ──────────────────────────────────────────────────────────
  describe('CR-D03 – remove elimina la receta cuando el usuario es el dueño', () => {
    it('debe llamar a recipeRepo.remove con la receta correcta', async () => {
      // Test Double: Mock – toHaveBeenCalledWith verifica que remove recibe la receta exacta
      // Arrange – Mock: verificamos que remove sea llamado con la receta exacta
      const ownerUser = { id: 'owner-confirmed' } as User;
      const mockRecipe = {
        id: 'recipe-propia',
        name: 'Paella del dueño',
        user: { id: 'owner-confirmed' },
      };
      recipeRepo.findOne.mockResolvedValue(mockRecipe);
      recipeRepo.remove.mockResolvedValue(undefined); // Mock

      // Act
      await service.remove('recipe-propia', ownerUser);

      // Assert
      expect(recipeRepo.remove).toHaveBeenCalledTimes(1);
      expect(recipeRepo.remove).toHaveBeenCalledWith(mockRecipe);
    });
  });

  // ──────────────────────────────────────────────────────────
  // CR-D04: remove retorna void (undefined)
  // ──────────────────────────────────────────────────────────
  describe('CR-D04 – remove retorna undefined tras eliminar', () => {
    it('debe completar sin retornar ningún valor', async () => {
      // Test Double: Stub – mockResolvedValue undefined sin verificar args
      // Arrange – Mock
      const ownerUser = { id: 'owner-void' } as User;
      const mockRecipe = {
        id: 'recipe-void',
        name: 'Receta a eliminar',
        user: { id: 'owner-void' },
      };
      recipeRepo.findOne.mockResolvedValue(mockRecipe);
      recipeRepo.remove.mockResolvedValue(undefined);

      // Act
      const result = await service.remove('recipe-void', ownerUser);

      // Assert
      expect(result).toBeUndefined();
    });
  });
});
