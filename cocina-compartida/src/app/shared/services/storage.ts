import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_KEY, SUPABASE_URL } from '../../../environments/environment';
import { v4 as uuidv4 } from 'uuid';


@Injectable({
  providedIn: 'root'
})
export class Storage {

  private supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  private async uploadFileToBucket(imageFile: File, bucket: string, path: string): Promise<string> {
    const fileName = uuidv4();
    const objectPath = `${path}/${fileName}`.replace(/(^\/|\/\/$)/g, '');

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(objectPath, imageFile, { cacheControl: '3600', upsert: false });

    if (error) throw error;
    const returnedPath = (data as any)?.path ?? (data as any)?.fullPath ?? objectPath;
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${returnedPath}`;
  }

  uploadRecipeImage(imageFile: File, recipeId: string) {
    return this.uploadFileToBucket(imageFile, 'recipes', recipeId);
  }

  uploadAvatar(imageFile: File, username: string) {
    const safeUser = username || 'anonymous';
    return this.uploadFileToBucket(imageFile, 'avatars', safeUser);
  }

  getPublicUrl(bucket: string, path: string) {
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  }

  async deleteFile(bucket: string, objectPath: string): Promise<void> {
    try {
      const normalized = objectPath.replace(/^\//, '');
      const { error } = await this.supabase.storage.from(bucket).remove([normalized]);
      if (error) {
        console.error(`Error eliminando archivo ${normalized} en bucket ${bucket}:`, error);
        throw error;
      }
    } catch (e) {
      console.error('Error inesperado en deleteFile:', e);
      throw e;
    }
  }

  async deletePhotoByPublicUrl(publicUrlOrPath: string): Promise<void> {
    try {
      if (!publicUrlOrPath) return;
      const urlWithoutQuery = publicUrlOrPath.split('?')[0];

      const publicSegment = '/storage/v1/object/public/';

      if (urlWithoutQuery.includes(publicSegment)) {
        const idx = urlWithoutQuery.indexOf(publicSegment) + publicSegment.length;
        const bucketAndPath = urlWithoutQuery.substring(idx);

        const firstSlash = bucketAndPath.indexOf('/');
        if (firstSlash === -1) {
          throw new Error('URL pública inválida: no contiene ruta dentro del bucket');
        }
        const bucket = bucketAndPath.substring(0, firstSlash);
        const objectPath = bucketAndPath.substring(firstSlash + 1);
        await this.deleteFile(bucket, objectPath);
        return;
      }

      const parts = urlWithoutQuery.split('/').filter(Boolean);
      if (parts.length >= 2) {
        const bucket = parts[0];
        const objectPath = parts.slice(1).join('/');
        await this.deleteFile(bucket, objectPath);
        return;
      }

      throw new Error('No se pudo interpretar la URL/ruta para eliminar la foto');
    } catch (e) {
      console.error('Error eliminando foto por URL/ruta:', e);
      throw e;
    }
  }

  async deleteRecipeImages(recipeId: string): Promise<void> {
    try {

      const { data, error } = await this.supabase.storage.from('recipes').list(recipeId, { limit: 1000 });
      if (error) {
        console.error('Error listando archivos en bucket recipes:', error);
        return;
      }

      if (!data || (data as any[]).length === 0) return;

      // Construir paths a eliminar
      const paths = (data as any[]).map(f => `${recipeId}/${f.name}`);

      const { error: removeError } = await this.supabase.storage.from('recipes').remove(paths);
      if (removeError) {
        console.error('Error eliminando archivos en bucket recipes:', removeError);
      }
    } catch (e) {
      console.error('Error inesperado eliminando imágenes de receta:', e);
    }
  }

}