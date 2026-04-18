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
  UseGuards
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'node:path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { AuthGuard } from 'src/security/auth.guard';
import * as crypto from 'node:crypto';

@Controller('uploads')
export class UploadsController {
  
  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'avatars');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const username = req.query.username as string || 'default';
          const ext = extname(file.originalname);
          cb(null, `${username}-${Date.now()}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  uploadAvatar(@UploadedFile() file: any, @Query('username') username: string) {
    if (!file) {
      throw new BadRequestException('Archivo no provisto');
    }
    return { url: `/uploads/avatars/${file.filename}` };
  }

  @Post('recipes/:recipeId')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const recipeId = req.params.recipeId;
          const uploadPath = join(process.cwd(), 'uploads', 'recipes', recipeId);
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(8).toString('hex');
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  uploadRecipeImages(@UploadedFiles() files: Array<any>, @Param('recipeId') recipeId: string) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se han subido archivos');
    }
    const urls = files.map(file => `/uploads/recipes/${recipeId}/${file.filename}`);
    return { urls };
  }

  @Delete()
  @UseGuards(AuthGuard)
  deletePhoto(@Body('path') filePath: string) {
    if (!filePath) {
      throw new BadRequestException('Path no provisto');
    }
    const fullPath = join(process.cwd(), 'uploads', filePath);
    try {
      if (existsSync(fullPath)) {
        unlinkSync(fullPath);
      }
      return { message: 'Archivo eliminado' };
    } catch (e) {
      throw new BadRequestException('Error al eliminar archivo');
    }
  }
}
