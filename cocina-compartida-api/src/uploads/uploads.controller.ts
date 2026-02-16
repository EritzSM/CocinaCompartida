import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  Param,
  UploadedFile,
  Body,
  Delete,
  Query,
  Get,
} from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { promises as fs } from 'fs';

function filename(req: any, file: any, cb: Function) {
  const name = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const fileExt = extname(file.originalname);
  cb(null, `${name}${fileExt}`);
}

@Controller('uploads')
export class UploadsController {
  
  // ✅ Endpoint de debug - ELIMINAR EN PRODUCCIÓN
  @Get('debug')
  async debugUploads() {
    const uploadsPath = join(process.cwd(), 'uploads');
    try {
      const findFiles = async (dir: string, fileList: string[] = []) => {
        try {
          const files = await fs.readdir(dir);
          for (const file of files) {
            const filePath = join(dir, file);
            const stat = await fs.stat(filePath);
            if (stat.isDirectory()) {
              await findFiles(filePath, fileList);
            } else {
              fileList.push(filePath.replace(uploadsPath, ''));
            }
          }
        } catch (e) {
          // Directorio no existe o no es accesible
        }
        return fileList;
      };
      
      const files = await findFiles(uploadsPath);
      return { 
        uploadsPath,
        cwd: process.cwd(),
        totalFiles: files.length,
        files 
      };
    } catch (e) {
      return { error: String(e), uploadsPath, cwd: process.cwd() };
    }
  }

  // Upload multiple images for a recipe
  @Post('recipes/:id')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: diskStorage({
        destination: async (req, file, cb) => {
          const recipeId = req.params.id;
          const dir = join(process.cwd(), 'uploads', 'recipes', recipeId);
          await fs.mkdir(dir, { recursive: true });
          cb(null, dir);
        },
        filename,
      }),
    }),
  )
  async uploadRecipeFiles(@Param('id') id: string, @UploadedFiles() files: any[]) {
    const urls = (files || []).map(f => `/uploads/recipes/${id}/${f.filename}`);
    console.log(`✅ Uploaded ${urls.length} recipe images for recipe ${id}`);
    return { urls };
  }

  // ✅ Upload avatar - SIMPLIFICADO sin subdirectorios por usuario
  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: async (req, file, cb) => {
          // Guardar todos los avatares en una sola carpeta
          const dir = join(process.cwd(), 'uploads', 'avatars');
          try {
            await fs.mkdir(dir, { recursive: true });
            cb(null, dir);
          } catch (error) {
            console.error('❌ Error creating avatars directory:', error);
            cb(error as Error, dir);
          }
        },
        filename: (req, file, cb) => {
          // Incluir username en el nombre del archivo si está disponible
          const username = (req.query.username as string) || 'anonymous';
          const timestamp = Date.now();
          const random = Math.round(Math.random() * 1e9);
          const fileExt = extname(file.originalname);
          const cleanUsername = username.replace(/[^a-zA-Z0-9-_]/g, ''); // Sanitizar
          // Formato: username-timestamp-random.ext
          cb(null, `${cleanUsername}-${timestamp}-${random}${fileExt}`);
        },
      }),
    }),
  )
  async uploadAvatar(@UploadedFile() file: any, @Query('username') username?: string) {
    if (!file) {
      console.error('❌ No file uploaded');
      return { error: 'No file uploaded' };
    }
    
    const url = `/uploads/avatars/${file.filename}`;
    console.log('✅ Avatar uploaded:', {
      username,
      filename: file.filename,
      url,
      path: file.path,
      size: file.size,
    });
    
    return { url };
  }

  // Delete file by path (relative to /uploads)
  @Delete()
  async deleteFile(@Body() body: { path: string }) {
    if (!body || !body.path) {
      console.error('❌ No path provided for deletion');
      return { ok: false, error: 'No path provided' };
    }
    
    const p = join(process.cwd(), 'uploads', body.path.replace(/^\/uploads\//, ''));
    console.log('🗑️  Attempting to delete file:', p);
    
    try {
      await fs.unlink(p);
      console.log('✅ File deleted successfully:', p);
      return { ok: true };
    } catch (e) {
      console.error('❌ Delete failed:', e);
      return { ok: false, error: String(e) };
    }
  }
}