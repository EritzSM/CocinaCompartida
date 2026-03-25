import { TestBed } from '@angular/core/testing';
import { RecipeImageService } from '../shared/services/recipe-image.service';
import { UploadService } from '../shared/services/upload';
import { Storage } from '../shared/services/storage';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  RECIPE IMAGE SERVICE – Pruebas Unitarias (Patrón AAA)
//  Funcionalidad: Gestión de imágenes (upload, remove, navigate)
//
//  Tipos de Mocks: Spy, Stub, Mock, Dummy, Fake
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('RecipeImageService – Pruebas Unitarias', () => {
  let service: RecipeImageService;
  let mockUploadService: jasmine.SpyObj<UploadService>;
  let mockStorage: jasmine.SpyObj<Storage>;

  beforeEach(() => {
    // Test Double (Spy): Upload y Storage
    mockUploadService = jasmine.createSpyObj('UploadService', ['uploadMultipleFiles']);
    mockStorage = jasmine.createSpyObj('Storage', ['deletePhotoByPublicUrl']);

    TestBed.configureTestingModule({
      providers: [
        RecipeImageService,
        { provide: UploadService, useValue: mockUploadService },
        { provide: Storage, useValue: mockStorage }
      ]
    });

    service = TestBed.inject(RecipeImageService);
  });

  // ──────────── uploadFiles ────────────
  describe('uploadFiles', () => {
    it('RI-01: upload exitoso agrega URLs al array images (Mock)', async () => {
      // Arrange
      const files = [new File([''], 'img1.jpg')] as File[];
      mockUploadService.uploadMultipleFiles.and.returnValue(
        Promise.resolve({ success: true, data: ['url1.jpg', 'url2.jpg'] })
      );

      // Act
      const result = await service.uploadFiles(files, 'recipe-id');

      // Assert
      expect(result).toBeTrue();
      expect(service.images).toEqual(['url1.jpg', 'url2.jpg']);
      expect(service.isUploading).toBeFalse();
    });

    it('RI-02: upload fallido retorna false sin modificar images (Stub)', async () => {
      // Arrange
      mockUploadService.uploadMultipleFiles.and.returnValue(
        Promise.resolve({ success: false, error: 'Upload failed' })
      );

      // Act
      const result = await service.uploadFiles([new File([''], 'img.jpg')], 'rid');

      // Assert
      expect(result).toBeFalse();
      expect(service.images).toEqual([]);
    });

    it('RI-03: retorna false si no hay archivos (Dummy vacío)', async () => {
      // Arrange & Act
      const result = await service.uploadFiles([], 'rid');

      // Assert
      expect(result).toBeFalse();
      expect(mockUploadService.uploadMultipleFiles).not.toHaveBeenCalled();
    });

    it('RI-04: maneja excepción en upload (Fake reject)', async () => {
      // Arrange
      mockUploadService.uploadMultipleFiles.and.returnValue(Promise.reject(new Error('Crash')));

      // Act
      const result = await service.uploadFiles([new File([''], 'x.jpg')], 'rid');

      // Assert
      expect(result).toBeFalse();
      expect(service.isUploading).toBeFalse();
    });

    it('RI-05: isUploading se pone en true durante el upload', async () => {
      // Arrange
      let uploadingDuring = false;
      mockUploadService.uploadMultipleFiles.and.callFake(async () => {
        uploadingDuring = service.isUploading;
        return { success: true, data: ['url.jpg'] };
      });

      // Act
      await service.uploadFiles([new File([''], 'x.jpg')], 'rid');

      // Assert
      expect(uploadingDuring).toBeTrue();
      expect(service.isUploading).toBeFalse();
    });
  });

  // ──────────── removeImage ────────────
  describe('removeImage', () => {
    beforeEach(() => {
      service.images = ['img0.jpg', 'img1.jpg', 'img2.jpg'];
      service.currentIndex = 1;
    });

    it('RI-06: remueve imagen del array y llama deletePhotoByPublicUrl (Spy)', async () => {
      // Arrange
      mockStorage.deletePhotoByPublicUrl.and.returnValue(Promise.resolve());

      // Act
      await service.removeImage(1);

      // Assert
      expect(service.images).toEqual(['img0.jpg', 'img2.jpg']);
      expect(mockStorage.deletePhotoByPublicUrl).toHaveBeenCalledWith('img1.jpg');
    });

    it('RI-07: ajusta currentIndex si se excede después de remover', async () => {
      // Arrange
      service.currentIndex = 2;
      mockStorage.deletePhotoByPublicUrl.and.returnValue(Promise.resolve());

      // Act
      await service.removeImage(2);

      // Assert
      expect(service.currentIndex).toBe(1); // ajustado al último
    });

    it('RI-08: no hace nada si índice es negativo', async () => {
      // Arrange & Act
      await service.removeImage(-1);

      // Assert
      expect(service.images.length).toBe(3);
      expect(mockStorage.deletePhotoByPublicUrl).not.toHaveBeenCalled();
    });

    it('RI-09: no hace nada si índice excede el array', async () => {
      // Arrange & Act
      await service.removeImage(10);

      // Assert
      expect(service.images.length).toBe(3);
    });

    it('RI-10: maneja error en deletePhotoByPublicUrl sin romper (Stub error)', async () => {
      // Arrange
      mockStorage.deletePhotoByPublicUrl.and.returnValue(Promise.reject(new Error('Storage error')));
      spyOn(console, 'error');

      // Act
      await service.removeImage(0);

      // Assert
      expect(service.images.length).toBe(2); // se removió del array local igual
      expect(console.error).toHaveBeenCalled();
    });
  });

  // ──────────── navigateImages ────────────
  describe('navigateImages', () => {
    beforeEach(() => {
      service.images = ['a.jpg', 'b.jpg', 'c.jpg'];
      service.currentIndex = 0;
    });

    it('RI-11: next avanza al siguiente', () => {
      service.navigateImages('next');
      expect(service.currentIndex).toBe(1);
    });

    it('RI-12: next vuelve a 0 desde el último', () => {
      service.currentIndex = 2;
      service.navigateImages('next');
      expect(service.currentIndex).toBe(0);
    });

    it('RI-13: prev retrocede', () => {
      service.currentIndex = 2;
      service.navigateImages('prev');
      expect(service.currentIndex).toBe(1);
    });

    it('RI-14: prev va al último desde 0', () => {
      service.currentIndex = 0;
      service.navigateImages('prev');
      expect(service.currentIndex).toBe(2);
    });

    it('RI-15: no hace nada si images está vacío', () => {
      service.images = [];
      service.currentIndex = 0;
      service.navigateImages('next');
      expect(service.currentIndex).toBe(0);
    });
  });

  // ──────────── resetImages ────────────
  describe('resetImages', () => {
    it('RI-16: resetea images y currentIndex a valores iniciales', () => {
      // Arrange
      service.images = ['a.jpg', 'b.jpg'];
      service.currentIndex = 1;

      // Act
      service.resetImages();

      // Assert
      expect(service.images).toEqual([]);
      expect(service.currentIndex).toBe(0);
    });
  });
});
