import { TestBed } from '@angular/core/testing';
import { UploadService } from '../shared/services/upload';
import { Storage } from '../shared/services/storage';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  UPLOAD SERVICE – Pruebas Unitarias (Patrón AAA)
//  Funcionalidad: Validación de imágenes, upload múltiple/simple
//
//  Tipos de Mocks: Spy, Stub, Dummy, Mock, Fake
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('UploadService – Pruebas Unitarias', () => {
  let service: UploadService;
  let mockStorage: jasmine.SpyObj<Storage>;

  beforeEach(() => {
    mockStorage = jasmine.createSpyObj('Storage', ['uploadRecipeImage', 'uploadAvatar']);

    TestBed.configureTestingModule({
      providers: [
        UploadService,
        { provide: Storage, useValue: mockStorage }
      ]
    });

    service = TestBed.inject(UploadService);
  });

  // ──────────── validateImage ────────────
  describe('validateImage', () => {
    it('UP-01: JPEG válido retorna isValid true (Dummy)', () => {
      // Arrange
      const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });

      // Act
      const result = service.validateImage(file);

      // Assert
      expect(result.isValid).toBeTrue();
      expect(result.error).toBeUndefined();
    });

    it('UP-02: PNG válido retorna isValid true', () => {
      const file = new File(['data'], 'photo.png', { type: 'image/png' });
      expect(service.validateImage(file).isValid).toBeTrue();
    });

    it('UP-03: WebP válido retorna isValid true', () => {
      const file = new File(['data'], 'photo.webp', { type: 'image/webp' });
      expect(service.validateImage(file).isValid).toBeTrue();
    });

    it('UP-04: GIF válido retorna isValid true', () => {
      const file = new File(['data'], 'anim.gif', { type: 'image/gif' });
      expect(service.validateImage(file).isValid).toBeTrue();
    });

    it('UP-05: tipo no permitido retorna error (Stub)', () => {
      // Arrange
      const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });

      // Act
      const result = service.validateImage(file);

      // Assert
      expect(result.isValid).toBeFalse();
      expect(result.error).toContain('Tipo de archivo no permitido');
    });

    it('UP-06: archivo demasiado grande (>5MB) retorna error', () => {
      // Arrange - crear archivo con tamaño > 5MB
      const bigData = new ArrayBuffer(6 * 1024 * 1024);
      const file = new File([bigData], 'big.jpg', { type: 'image/jpeg' });

      // Act
      const result = service.validateImage(file);

      // Assert
      expect(result.isValid).toBeFalse();
      expect(result.error).toContain('demasiado grande');
    });

    it('UP-07: archivo exactamente 5MB es válido', () => {
      // Arrange
      const exactData = new ArrayBuffer(5 * 1024 * 1024);
      const file = new File([exactData], 'exact.jpg', { type: 'image/jpeg' });

      // Act
      const result = service.validateImage(file);

      // Assert
      expect(result.isValid).toBeTrue();
    });
  });

  // ──────────── uploadMultipleFiles ────────────
  describe('uploadMultipleFiles', () => {
    it('UP-08: upload exitoso retorna success con URLs (Mock)', async () => {
      // Arrange
      const file = new File(['small'], 'img.jpg', { type: 'image/jpeg' });
      mockStorage.uploadRecipeImage.and.returnValue(Promise.resolve('https://cdn/img.jpg'));

      // Act
      const result = await service.uploadMultipleFiles([file], 'recipe-1');

      // Assert
      expect(result.success).toBeTrue();
      expect(result.data).toEqual(['https://cdn/img.jpg']);
    });

    it('UP-09: archivo inválido retorna error (Stub)', async () => {
      // Arrange
      const badFile = new File(['data'], 'doc.pdf', { type: 'application/pdf' });

      // Act
      const result = await service.uploadMultipleFiles([badFile], 'rid');

      // Assert
      expect(result.success).toBeFalse();
      expect(result.error).toContain('Tipo de archivo no permitido');
    });

    it('UP-10: error en storage retorna failure (Fake reject)', async () => {
      // Arrange
      const file = new File(['data'], 'img.jpg', { type: 'image/jpeg' });
      mockStorage.uploadRecipeImage.and.returnValue(Promise.reject(new Error('Network fail')));

      // Act
      const result = await service.uploadMultipleFiles([file], 'rid');

      // Assert
      expect(result.success).toBeFalse();
      expect(result.error).toBe('Network fail');
    });

    it('UP-11: genera recipeId si no se proporciona', async () => {
      // Arrange
      const file = new File(['data'], 'img.jpg', { type: 'image/jpeg' });
      mockStorage.uploadRecipeImage.and.returnValue(Promise.resolve('url'));

      // Act
      const result = await service.uploadMultipleFiles([file]);

      // Assert
      expect(result.success).toBeTrue();
      expect(mockStorage.uploadRecipeImage).toHaveBeenCalled();
    });

    it('UP-16: comprime imagen grande antes de subir varias imagenes', async () => {
      // Arrange
      const bigFile = new File([new ArrayBuffer(2 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' });
      const compressed = new File(['small'], 'big.jpg', { type: 'image/jpeg' });
      spyOn<any>(service, 'compressImage').and.returnValue(Promise.resolve(compressed));
      mockStorage.uploadRecipeImage.and.returnValue(Promise.resolve('compressed-url'));

      // Act
      const result = await service.uploadMultipleFiles([bigFile], 'recipe-compress');

      // Assert
      expect(result.success).toBeTrue();
      expect((service as any).compressImage).toHaveBeenCalledWith(bigFile);
      expect(mockStorage.uploadRecipeImage).toHaveBeenCalledWith(compressed, 'recipe-compress');
    });

    it('UP-17: retorna error si falla la compresion multiple', async () => {
      // Arrange
      const bigFile = new File([new ArrayBuffer(2 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' });
      spyOn<any>(service, 'compressImage').and.returnValue(Promise.reject(new Error('Compression fail')));

      // Act
      const result = await service.uploadMultipleFiles([bigFile], 'recipe-error');

      // Assert
      expect(result.success).toBeFalse();
      expect(result.error).toBe('Compression fail');
      expect(mockStorage.uploadRecipeImage).not.toHaveBeenCalled();
    });
  });

  // ──────────── uploadFile (avatar) ────────────
  describe('uploadFile (avatar)', () => {
    it('UP-12: upload avatar exitoso (Spy)', async () => {
      // Arrange
      const file = new File(['data'], 'avatar.png', { type: 'image/png' });
      mockStorage.uploadAvatar.and.returnValue(Promise.resolve('https://cdn/avatar.png'));

      // Act
      const result = await service.uploadFile(file, false, 'testuser');

      // Assert
      expect(result.success).toBeTrue();
      expect(result.data).toBe('https://cdn/avatar.png');
    });

    it('UP-13: archivo inválido para avatar retorna error', async () => {
      // Arrange
      const file = new File(['data'], 'bad.txt', { type: 'text/plain' });

      // Act
      const result = await service.uploadFile(file);

      // Assert
      expect(result.success).toBeFalse();
    });

    it('UP-14: error en storage para avatar retorna failure', async () => {
      // Arrange
      const file = new File(['data'], 'img.jpg', { type: 'image/jpeg' });
      mockStorage.uploadAvatar.and.returnValue(Promise.reject(new Error('Fail')));

      // Act
      const result = await service.uploadFile(file, false, 'user');

      // Assert
      expect(result.success).toBeFalse();
    });

    it('UP-15: sin username usa tmp-uuid como path', async () => {
      // Arrange
      const file = new File(['data'], 'img.jpg', { type: 'image/jpeg' });
      mockStorage.uploadAvatar.and.returnValue(Promise.resolve('url'));

      // Act
      await service.uploadFile(file, false);

      // Assert
      const callArgs = mockStorage.uploadAvatar.calls.first().args;
      expect(callArgs[1]).toMatch(/^tmp-/); // username generado con uuid
    });

    it('UP-18: trim del username antes de subir avatar', async () => {
      // Arrange
      const file = new File(['data'], 'img.jpg', { type: 'image/jpeg' });
      mockStorage.uploadAvatar.and.returnValue(Promise.resolve('url'));

      // Act
      await service.uploadFile(file, false, '  chefqa  ');

      // Assert
      expect(mockStorage.uploadAvatar).toHaveBeenCalledWith(file, 'chefqa');
    });

    it('UP-19: comprime avatar grande cuando compress es true', async () => {
      // Arrange
      const bigFile = new File([new ArrayBuffer(2 * 1024 * 1024)], 'avatar.jpg', { type: 'image/jpeg' });
      const compressed = new File(['small'], 'avatar.jpg', { type: 'image/jpeg' });
      spyOn<any>(service, 'compressImage').and.returnValue(Promise.resolve(compressed));
      mockStorage.uploadAvatar.and.returnValue(Promise.resolve('avatar-url'));

      // Act
      const result = await service.uploadFile(bigFile, true, 'chef');

      // Assert
      expect(result.success).toBeTrue();
      expect((service as any).compressImage).toHaveBeenCalledWith(bigFile);
      expect(mockStorage.uploadAvatar).toHaveBeenCalledWith(compressed, 'chef');
    });

    it('UP-20: no comprime avatar grande cuando compress es false', async () => {
      // Arrange
      const bigFile = new File([new ArrayBuffer(2 * 1024 * 1024)], 'avatar.jpg', { type: 'image/jpeg' });
      const compressSpy = spyOn<any>(service, 'compressImage').and.callThrough();
      mockStorage.uploadAvatar.and.returnValue(Promise.resolve('avatar-url'));

      // Act
      const result = await service.uploadFile(bigFile, false, 'chef');

      // Assert
      expect(result.success).toBeTrue();
      expect(compressSpy).not.toHaveBeenCalled();
      expect(mockStorage.uploadAvatar).toHaveBeenCalledWith(bigFile, 'chef');
    });
  });
});
