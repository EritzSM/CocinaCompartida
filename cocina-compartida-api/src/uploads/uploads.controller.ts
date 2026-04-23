import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Query,
  Param,
  BadRequestException,
  Delete,
  Body,
  UseGuards,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthGuard } from 'src/security/auth.guard';
import { SupabaseStorageService } from './supabase-storage.service';

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const imageFileFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  if (IMAGE_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Tipo de archivo no permitido. Use JPEG, PNG, WebP o GIF'), false);
  }
};

@Controller('uploads')
export class UploadsController {
  constructor(private readonly storageService: SupabaseStorageService) {}

  // ─── Avatar ──────────────────────────────────────────────────────────────

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: imageFileFilter,
    }),
  )
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Query('username') username: string,
  ) {
    if (!file) throw new BadRequestException('Archivo no provisto');

    try {
      const url = await this.storageService.uploadAvatar(file, username || 'default');
      return { url };
    } catch (e: any) {
      throw new InternalServerErrorException(e.message);
    }
  }

  // ─── Recipe images ────────────────────────────────────────────────────────

  @Post('recipes/:recipeId')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: imageFileFilter,
    }),
  )
  async uploadRecipeImages(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Param('recipeId') recipeId: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se han subido archivos');
    }

    try {
      const urls = await Promise.all(
        files.map((file) => this.storageService.uploadRecipeImage(file, recipeId)),
      );
      return { urls };
    } catch (e: any) {
      throw new InternalServerErrorException(e.message);
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  @Delete()
  @UseGuards(AuthGuard)
  async deletePhoto(@Body('path') filePath: string) {
    if (!filePath) throw new BadRequestException('Path no provisto');

    try {
      await this.storageService.deleteFile(filePath);
      return { message: 'Archivo eliminado' };
    } catch (e: any) {
      throw new InternalServerErrorException('Error al eliminar archivo');
    }
  }
}
