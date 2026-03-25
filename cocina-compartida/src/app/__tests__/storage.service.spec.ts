import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Storage } from '../shared/services/storage';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  STORAGE SERVICE – Pruebas Unitarias (Patrón AAA)
//  Funcionalidad: Upload/delete de archivos via API
//
//  Tipos de Mocks: Mock HTTP, Dummy data, Stub responses
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('Storage Service – Pruebas Unitarias', () => {
  let service: Storage;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Storage]
    });
    service = TestBed.inject(Storage);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('uploadRecipeImage', () => {
    it('ST-01: POST al endpoint correcto y retorna URL (Mock HTTP)', async () => {
      // Arrange
      const file = new File(['data'], 'img.jpg', { type: 'image/jpeg' });

      // Act
      const promise = service.uploadRecipeImage(file, 'recipe-1');
      const req = httpMock.expectOne('/api/uploads/recipes/recipe-1');
      expect(req.request.method).toBe('POST');
      req.flush({ urls: ['https://cdn/img.jpg'] });
      const result = await promise;

      // Assert
      expect(result).toBe('https://cdn/img.jpg');
    });

    it('ST-02: retorna string vacío si urls está vacío', async () => {
      // Arrange
      const file = new File(['data'], 'img.jpg', { type: 'image/jpeg' });

      // Act
      const promise = service.uploadRecipeImage(file, 'rid');
      httpMock.expectOne('/api/uploads/recipes/rid').flush({ urls: [] });
      const result = await promise;

      // Assert
      expect(result).toBe('');
    });
  });

  describe('uploadAvatar', () => {
    it('ST-03: POST con username query param (Mock)', async () => {
      // Arrange
      const file = new File(['data'], 'avatar.png', { type: 'image/png' });

      // Act
      const promise = service.uploadAvatar(file, 'testuser');
      const req = httpMock.expectOne('/api/uploads/avatar?username=testuser');
      expect(req.request.method).toBe('POST');
      req.flush({ url: 'https://cdn/avatar.png' });
      const result = await promise;

      // Assert
      expect(result).toBe('https://cdn/avatar.png');
    });

    it('ST-04: sin username no incluye query param', async () => {
      // Arrange
      const file = new File(['data'], 'avatar.png', { type: 'image/png' });

      // Act
      const promise = service.uploadAvatar(file, '');
      const req = httpMock.expectOne('/api/uploads/avatar');
      req.flush({ url: 'url' });
      await promise;

      // Assert - verify no query param
      expect(req.request.url).toBe('/api/uploads/avatar');
    });
  });

  describe('deletePhotoByPublicUrl', () => {
    it('ST-05: DELETE extrae path correctamente (Dummy)', async () => {
      // Arrange & Act
      const promise = service.deletePhotoByPublicUrl('https://cdn/uploads/recipes/img.jpg');
      const req = httpMock.expectOne('/api/uploads');
      expect(req.request.method).toBe('DELETE');
      expect(req.request.body.path).toBe('recipes/img.jpg');
      req.flush({});
      await promise;
    });

    it('ST-06: no hace request si URL está vacía', async () => {
      // Act
      await service.deletePhotoByPublicUrl('');

      // Assert - no HTTP request
      httpMock.expectNone('/api/uploads');
    });

    it('ST-07: propaga error en DELETE (Stub error)', async () => {
      // Arrange
      spyOn(console, 'error');

      // Act & Assert
      const promise = service.deletePhotoByPublicUrl('/uploads/test.jpg');
      httpMock.expectOne('/api/uploads').flush(null, { status: 500, statusText: 'Error' });

      await expectAsync(promise).toBeRejected();
    });
  });

  describe('getPublicUrlForPath', () => {
    it('ST-08: retorna string vacío para path vacío', () => {
      expect(service.getPublicUrlForPath('')).toBe('');
    });

    it('ST-09: retorna el path si ya empieza con /uploads/', () => {
      expect(service.getPublicUrlForPath('/uploads/img.jpg')).toBe('/uploads/img.jpg');
    });

    it('ST-10: agrega prefijo /uploads/ a path relativo', () => {
      expect(service.getPublicUrlForPath('recipes/img.jpg')).toBe('/uploads/recipes/img.jpg');
    });

    it('ST-11: no duplica slash al inicio', () => {
      expect(service.getPublicUrlForPath('/recipes/img.jpg')).toBe('/uploads/recipes/img.jpg');
    });
  });
});
