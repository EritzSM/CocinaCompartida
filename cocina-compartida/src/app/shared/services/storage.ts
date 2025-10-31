import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_KEY, SUPABASE_URL } from '../../../environments/environment';
import { v4 as uuidv4 } from 'uuid';


@Injectable({
  providedIn: 'root'
})
export class Storage {

  private supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  // Sube un archivo al bucket indicado y devuelve la URL pública del objeto
  private async uploadFileToBucket(imageFile: File, bucket: string, path: string): Promise<string> {
    const fileName = uuidv4();
    const objectPath = `${path}/${fileName}`.replace(/(^\/|\/\/$)/g, '');

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(objectPath, imageFile, { cacheControl: '3600', upsert: false });

    if (error) throw error;

    // data?.path normalmente contiene la ruta relativa dentro del bucket
    const returnedPath = (data as any)?.path ?? (data as any)?.fullPath ?? objectPath;
    // Devolver URL pública: /storage/v1/object/public/{bucket}/{path}
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${returnedPath}`;
  }

  // Subir imagenes de receta en subcarpeta por receta
  uploadRecipeImage(imageFile: File, recipeId: string) {
    return this.uploadFileToBucket(imageFile, 'recipes', recipeId);
  }

  // Subir avatar de usuario en bucket avatars/username/...
  uploadAvatar(imageFile: File, username: string) {
    const safeUser = username || 'anonymous';
    return this.uploadFileToBucket(imageFile, 'avatars', safeUser);
  }

  // Helper pública para construir URL si se necesita (no usada directamente en los cambios)
  getPublicUrl(bucket: string, path: string) {
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  }

  // Eliminar un archivo específico en un bucket (ruta relativa dentro del bucket)
  async deleteFile(bucket: string, objectPath: string): Promise<void> {
    try {
      // Normalizar path (quitar / inicial si existe)
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

  // Borrar una foto indicando su URL pública (o la ruta "bucket/path/to/file").
  // Si se pasa la URL pública generada por Supabase, la función extraerá bucket y ruta.
  async deletePhotoByPublicUrl(publicUrlOrPath: string): Promise<void> {
    try {
      if (!publicUrlOrPath) return;

      // Quitar query string si existe
      const urlWithoutQuery = publicUrlOrPath.split('?')[0];

      // Si la entrada contiene la base SUPABASE_URL y el segmento /storage/v1/object/public/, la parseamos
      const publicSegment = '/storage/v1/object/public/';
      if (urlWithoutQuery.includes(publicSegment)) {
        const idx = urlWithoutQuery.indexOf(publicSegment) + publicSegment.length;
        const bucketAndPath = urlWithoutQuery.substring(idx);
        // bucketAndPath => '{bucket}/{path/to/file}'
        const firstSlash = bucketAndPath.indexOf('/');
        if (firstSlash === -1) {
          throw new Error('URL pública inválida: no contiene ruta dentro del bucket');
        }
        const bucket = bucketAndPath.substring(0, firstSlash);
        const objectPath = bucketAndPath.substring(firstSlash + 1);
        await this.deleteFile(bucket, objectPath);
        return;
      }

      // Si no es una URL pública, puede ser una ruta relativa 'bucket/path...'
      const parts = urlWithoutQuery.split('/').filter(Boolean);
      if (parts.length >= 2) {
        const bucket = parts[0];
        const objectPath = parts.slice(1).join('/');
        await this.deleteFile(bucket, objectPath);
        return;
      }

      // Si no pudimos interpretar, lanzamos un error
      throw new Error('No se pudo interpretar la URL/ruta para eliminar la foto');
    } catch (e) {
      console.error('Error eliminando foto por URL/ruta:', e);
      throw e;
    }
  }

  // Eliminar todas las imágenes asociadas a una receta (subcarpeta recipeId)
  async deleteRecipeImages(recipeId: string): Promise<void> {
    try {
      // Listar objetos dentro de la carpeta recipeId
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