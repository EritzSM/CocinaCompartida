import { Logger } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { SupabaseStorageService } from '../uploads/supabase-storage.service';

describe('SupabaseStorageService local', () => {
  let uploadsDir: string;

  const file = {
    originalname: 'photo.png',
    mimetype: 'image/png',
    buffer: Buffer.from('file'),
  } as Express.Multer.File;

  beforeEach(async () => {
    uploadsDir = join(process.cwd(), 'tmp-test-uploads', `${Date.now()}-${Math.random()}`);
    process.env.UPLOADS_DIR = uploadsDir;

    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    delete process.env.UPLOADS_DIR;
    await fs.rm(uploadsDir, { recursive: true, force: true });
  });

  it('UploadRecipeImage_CuandoUploadOk_DebeGuardarArchivoLocalYRetornarUrlPublica', async () => {
    const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
    const service = new SupabaseStorageService();

    const result = await service.uploadRecipeImage(file, 'r1');

    expect(result).toMatch(/^\/uploads\/recipes\/r1\/1700000000000-[a-f0-9]{16}\.png$/);
    const relativePath = result.replace('/uploads/', '');
    await expect(fs.readFile(join(uploadsDir, relativePath))).resolves.toEqual(file.buffer);

    dateSpy.mockRestore();
  });

  it('UploadRecipeImage_CuandoRecipeIdTieneCaracteresInvalidos_DebeSanitizarRuta', async () => {
    const service = new SupabaseStorageService();

    const result = await service.uploadRecipeImage(file, '../recipe id');

    expect(result).toContain('/uploads/recipes/___recipe_id/');
  });

  it('UploadAvatar_CuandoUploadOk_DebeGuardarAvatarYRetornarUrlPublica', async () => {
    const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
    const service = new SupabaseStorageService();

    const result = await service.uploadAvatar(file, 'user name');

    expect(result).toBe('/uploads/avatars/user_name-1700000000000.png');
    await expect(fs.readFile(join(uploadsDir, 'avatars', 'user_name-1700000000000.png'))).resolves.toEqual(file.buffer);

    dateSpy.mockRestore();
  });

  it('DeleteFile_CuandoRecibeUrlPublica_DebeEliminarArchivoLocal', async () => {
    const service = new SupabaseStorageService();
    await fs.mkdir(join(uploadsDir, 'recipes', 'r1'), { recursive: true });
    await fs.writeFile(join(uploadsDir, 'recipes', 'r1', 'img.png'), file.buffer);

    await service.deleteFile('http://localhost:3000/uploads/recipes/r1/img.png');

    await expect(fs.access(join(uploadsDir, 'recipes', 'r1', 'img.png'))).rejects.toThrow();
  });

  it('DeleteFile_CuandoNoExiste_NoDebeLanzarError', async () => {
    const service = new SupabaseStorageService();

    await expect(service.deleteFile('/uploads/recipes/r1/no-existe.png')).resolves.toBeUndefined();
  });

  it('DeleteFile_CuandoRutaSaleDelDirectorio_DebeIgnorarYAdvertir', async () => {
    const service = new SupabaseStorageService();

    await expect(service.deleteFile('../package.json')).resolves.toBeUndefined();

    expect(Logger.prototype.warn).toHaveBeenCalled();
  });
});
