import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { extname } from 'node:path';
import * as crypto from 'node:crypto';

@Injectable()
export class SupabaseStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private readonly supabase: SupabaseClient;
  private readonly bucket = 'cocina-compartida';

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key) {
      throw new Error(
        'SUPABASE_URL y SUPABASE_SERVICE_KEY son requeridas para el almacenamiento de imágenes',
      );
    }

    this.supabase = createClient(url, key);
  }

  /**
   * Sube una imagen de receta a Supabase Storage.
   * Ruta: recipes/<recipeId>/<timestamp>-<random>.<ext>
   * @returns URL pública del archivo
   */
  async uploadRecipeImage(file: Express.Multer.File, recipeId: string): Promise<string> {
    const ext = extname(file.originalname);
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    const filePath = `recipes/${recipeId}/${uniqueName}`;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      this.logger.error(`Error subiendo imagen de receta: ${error.message}`);
      throw new Error(`Error al subir imagen: ${error.message}`);
    }

    return this.getPublicUrl(filePath);
  }

  /**
   * Sube un avatar de usuario a Supabase Storage.
   * Ruta: avatars/<username>-<timestamp>.<ext>
   * @returns URL pública del archivo
   */
  async uploadAvatar(file: Express.Multer.File, username: string): Promise<string> {
    const ext = extname(file.originalname);
    const safeName = username.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = `avatars/${safeName}-${Date.now()}${ext}`;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true, // Los avatares se sobreescriben
      });

    if (error) {
      this.logger.error(`Error subiendo avatar: ${error.message}`);
      throw new Error(`Error al subir avatar: ${error.message}`);
    }

    return this.getPublicUrl(filePath);
  }

  /**
   * Elimina un archivo del bucket dado su path relativo o URL pública.
   */
  async deleteFile(pathOrUrl: string): Promise<void> {
    let filePath = pathOrUrl;

    // Si es una URL pública de Supabase, extraer solo el path dentro del bucket
    const marker = `/storage/v1/object/public/${this.bucket}/`;
    const idx = pathOrUrl.indexOf(marker);
    if (idx !== -1) {
      filePath = pathOrUrl.substring(idx + marker.length);
    }

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .remove([filePath]);

    if (error) {
      this.logger.warn(`No se pudo eliminar ${filePath}: ${error.message}`);
    }
  }

  private getPublicUrl(filePath: string): string {
    const { data } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(filePath);
    return data.publicUrl;
  }
}
