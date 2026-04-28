import { Logger } from '@nestjs/common';
import { SupabaseStorageService } from '../uploads/supabase-storage.service';
import { createClient } from '@supabase/supabase-js';

jest.mock(
  '@supabase/supabase-js',
  () => ({
    createClient: jest.fn(),
  }),
  { virtual: true },
);

describe('SupabaseStorageService', () => {
  const createClientMock = createClient as jest.Mock;

  let uploadMock: jest.Mock;
  let removeMock: jest.Mock;
  let getPublicUrlMock: jest.Mock;
  let fromMock: jest.Mock;

  const file = {
    originalname: 'photo.png',
    mimetype: 'image/png',
    buffer: Buffer.from('file'),
  } as Express.Multer.File;

  beforeEach(() => {
    process.env.SUPABASE_URL = 'http://supabase.test';
    process.env.SUPABASE_SERVICE_KEY = 'service-key';

    uploadMock = jest.fn();
    removeMock = jest.fn();
    getPublicUrlMock = jest.fn();
    fromMock = jest.fn().mockReturnValue({
      upload: uploadMock,
      remove: removeMock,
      getPublicUrl: getPublicUrlMock,
    });

    createClientMock.mockReturnValue({
      storage: { from: fromMock },
    });

    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Constructor_CuandoFaltanEnv_DebeLanzarError', () => {
    // Arrange
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_KEY;

    // Act
    const action = () => new SupabaseStorageService();

    // Assert
    expect(action).toThrow('SUPABASE_URL y SUPABASE_SERVICE_KEY son requeridas');
  });

  it('UploadRecipeImage_CuandoUploadOk_DebeRetornarUrlPublica', async () => {
    // Arrange
    const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
    uploadMock.mockResolvedValue({ error: null });
    getPublicUrlMock.mockReturnValue({ data: { publicUrl: 'https://public/recipes/r1/file.png' } });

    const service = new SupabaseStorageService();

    // Act
    const result = await service.uploadRecipeImage(file, 'r1');

    // Assert
    const [filePath, buffer, options] = uploadMock.mock.calls[0];
    expect(filePath).toMatch(/^recipes\/r1\/1700000000000-[a-f0-9]{16}\.png$/);
    expect(buffer).toBe(file.buffer);
    expect(options).toEqual({ contentType: 'image/png', upsert: false });
    expect(getPublicUrlMock).toHaveBeenCalledWith(filePath);
    expect(result).toBe('https://public/recipes/r1/file.png');

    dateSpy.mockRestore();
  });

  it('UploadRecipeImage_CuandoUploadFalla_DebeLanzarError', async () => {
    // Arrange
    uploadMock.mockResolvedValue({ error: { message: 'fail' } });
    const service = new SupabaseStorageService();

    // Act
    const action = service.uploadRecipeImage(file, 'r1');

    // Assert
    await expect(action).rejects.toThrow('Error al subir imagen: fail');
  });

  it('UploadAvatar_CuandoUploadOk_DebeRetornarUrlPublica', async () => {
    // Arrange
    const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
    uploadMock.mockResolvedValue({ error: null });
    getPublicUrlMock.mockReturnValue({ data: { publicUrl: 'https://public/avatars/u.png' } });

    const service = new SupabaseStorageService();

    // Act
    const result = await service.uploadAvatar(file, 'user name');

    // Assert
    expect(uploadMock).toHaveBeenCalledWith(
      'avatars/user_name-1700000000000.png',
      file.buffer,
      { contentType: 'image/png', upsert: true },
    );
    expect(result).toBe('https://public/avatars/u.png');

    dateSpy.mockRestore();
  });

  it('DeleteFile_CuandoUrlPublica_DebeEliminarPathRelativo', async () => {
    // Arrange
    removeMock.mockResolvedValue({ error: null });
    const service = new SupabaseStorageService();

    // Act
    await service.deleteFile('https://host/storage/v1/object/public/cocina-compartida/recipes/r1/img.png');

    // Assert
    expect(removeMock).toHaveBeenCalledWith(['recipes/r1/img.png']);
  });

  it('DeleteFile_CuandoRemoveFalla_NoDebeLanzar', async () => {
    // Arrange
    removeMock.mockResolvedValue({ error: { message: 'fail' } });
    const service = new SupabaseStorageService();

    // Act
    await service.deleteFile('recipes/r1/img.png');

    // Assert
    expect(Logger.prototype.warn).toHaveBeenCalled();
  });
});
