import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { UploadsController } from '../uploads/uploads.controller';

describe('UploadsController', () => {
  let controller: UploadsController;
  let storageService: {
    uploadAvatar: jest.Mock;
    uploadRecipeImage: jest.Mock;
    deleteFile: jest.Mock;
  };

  const file = {
    originalname: 'photo.png',
    mimetype: 'image/png',
    buffer: Buffer.from('file'),
  } as Express.Multer.File;

  beforeEach(() => {
    storageService = {
      uploadAvatar: jest.fn(),
      uploadRecipeImage: jest.fn(),
      deleteFile: jest.fn(),
    };
    controller = new UploadsController(storageService as any);
  });

  it('UploadAvatar_CuandoNoHayArchivo_DebeLanzarBadRequest', async () => {
    // Arrange
    const action = () => controller.uploadAvatar(undefined as any, 'user');

    // Act
    const result = action();

    // Assert
    await expect(result).rejects.toThrow(BadRequestException);
  });

  it('UploadAvatar_CuandoOk_DebeRetornarUrl', async () => {
    // Arrange
    storageService.uploadAvatar.mockResolvedValue('http://public/avatar.png');

    // Act
    const result = await controller.uploadAvatar(file, 'user');

    // Assert
    expect(storageService.uploadAvatar).toHaveBeenCalledWith(file, 'user');
    expect(result).toEqual({ url: 'http://public/avatar.png' });
  });

  it('UploadAvatar_CuandoStorageFalla_DebeLanzarInternalServerError', async () => {
    // Arrange
    storageService.uploadAvatar.mockRejectedValue(new Error('fail'));

    // Act
    const result = controller.uploadAvatar(file, 'user');

    // Assert
    await expect(result).rejects.toThrow(InternalServerErrorException);
  });

  it('UploadRecipeImages_CuandoNoHayArchivos_DebeLanzarBadRequest', async () => {
    // Arrange
    const action = () => controller.uploadRecipeImages([], 'r1');

    // Act
    const result = action();

    // Assert
    await expect(result).rejects.toThrow(BadRequestException);
  });

  it('UploadRecipeImages_CuandoOk_DebeRetornarUrls', async () => {
    // Arrange
    storageService.uploadRecipeImage
      .mockResolvedValueOnce('http://public/1.png')
      .mockResolvedValueOnce('http://public/2.png');

    // Act
    const result = await controller.uploadRecipeImages([file, file], 'r1');

    // Assert
    expect(storageService.uploadRecipeImage).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ urls: ['http://public/1.png', 'http://public/2.png'] });
  });

  it('UploadRecipeImages_CuandoStorageFalla_DebeLanzarInternalServerError', async () => {
    // Arrange
    storageService.uploadRecipeImage.mockRejectedValue(new Error('fail'));

    // Act
    const result = controller.uploadRecipeImages([file], 'r1');

    // Assert
    await expect(result).rejects.toThrow(InternalServerErrorException);
  });

  it('DeletePhoto_CuandoNoHayPath_DebeLanzarBadRequest', async () => {
    // Arrange
    const action = () => controller.deletePhoto('' as any);

    // Act
    const result = action();

    // Assert
    await expect(result).rejects.toThrow(BadRequestException);
  });

  it('DeletePhoto_CuandoOk_DebeRetornarMensaje', async () => {
    // Arrange
    storageService.deleteFile.mockResolvedValue(undefined);

    // Act
    const result = await controller.deletePhoto('recipes/r1/img.png');

    // Assert
    expect(storageService.deleteFile).toHaveBeenCalledWith('recipes/r1/img.png');
    expect(result).toEqual({ message: 'Archivo eliminado' });
  });

  it('DeletePhoto_CuandoStorageFalla_DebeLanzarInternalServerError', async () => {
    // Arrange
    storageService.deleteFile.mockRejectedValue(new Error('fail'));

    // Act
    const result = controller.deletePhoto('recipes/r1/img.png');

    // Assert
    await expect(result).rejects.toThrow(InternalServerErrorException);
  });
});
