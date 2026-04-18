import { Test, TestingModule } from '@nestjs/testing';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { NotFoundException } from '@nestjs/common';
import { Request, Response } from 'express';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '../security/auth.guard';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtService } from '@nestjs/jwt';

// Mock pdfkit — el módulo puede no estar instalado
jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => {
    const stream = {
      fontSize: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      moveDown: jest.fn().mockReturnThis(),
      pipe: jest.fn().mockReturnThis(),
      end: jest.fn(),
    };
    return stream;
  });
});

describe('RecipesController (Backend Download PDF Tests)', () => {
  let controller: RecipesController;
  let mockRecipesService: any;
  let reflector: Reflector;

  beforeEach(async () => {
    mockRecipesService = {
      findOne: jest.fn(),
      findAll: jest.fn(),
      findTopLiked: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      createComment: jest.fn(),
      findCommentsByRecipe: jest.fn(),
      removeComment: jest.fn(),
      toggleLike: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecipesController],
      providers: [
        { provide: RecipesService, useValue: mockRecipesService },
        { provide: JwtService, useValue: {} }, // Fix para el AuthGuard auto-instanciado
        Reflector
      ],
    }).compile();

    controller = module.get<RecipesController>(RecipesController);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // B-P01: Petición sin token JWT es rechazada por AuthGuard
  describe('B-P01', () => {
    it('Petición protegida por AuthGuard (requiere JWT)', () => {
      // Arrange
      // Spy sobre reflector para confirmar de facto la estructura decoradora
      const guards = Reflect.getMetadata(GUARDS_METADATA, controller.download);

      // Assert
      expect(guards).toBeDefined();
      expect(guards[0]).toBe(AuthGuard);
    });
  });

  // B-P02: Token válido pero receta inexistente lanza 404
  describe('B-P02', () => {
    it('Token válido pero receta inexistente lanza 404', async () => {
      // Arrange
      const req = { user: { id: 'user1' } } as unknown as Request;
      const res = { setHeader: jest.fn(), status: jest.fn() } as unknown as Response;

      // Stub
      mockRecipesService.findOne.mockRejectedValue(new NotFoundException('No recipe'));

      // Act & Assert
      await expect(controller.download('missing-id', req, res, 'pdf')).rejects.toThrow(NotFoundException);
    });
  });

  // B-P03: Receta encontrada retorna blob con Content-Type correcto
  describe('B-P03', () => {
    it('Receta encontrada retorna blob con Content-Type correcto', async () => {
      // Arrange
      const req = { user: { id: 'user1' } } as unknown as Request;
      
      const mockRes = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        send: jest.fn(),
        sendFile: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
        on: jest.fn(),
        once: jest.fn(),
        emit: jest.fn()
      } as unknown as Response;

      const mockRecipe = { 
        id: 'r1', 
        name: 'Pastel Gourmet', 
        descripcion: 'Dulce', 
        ingredients: ['Harina'], 
        steps: ['Hornear'] 
      };

      mockRecipesService.findOne.mockResolvedValue(mockRecipe);

      // Act
      await controller.download('r1', req, mockRes, 'pdf');

      // Assert
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Disposition', expect.stringContaining('filename="pastel_gourmet.pdf"'));
      expect(mockRecipesService.findOne).toHaveBeenCalledWith('r1');
    });
  });
});
