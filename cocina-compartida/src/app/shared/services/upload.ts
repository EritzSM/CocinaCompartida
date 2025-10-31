// services/upload.service.ts
import { Injectable, inject } from '@angular/core';
import { UploadResult } from '../interfaces/upload-result';
import { Storage } from './storage';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private storage = inject(Storage);
  // Validaciones de imagen
  validateImage(file: File): { isValid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (!allowedTypes.includes(file.type)) {
      return { 
        isValid: false, 
        error: 'Tipo de archivo no permitido. Use JPEG, PNG, WebP o GIF' 
      };
    }

    if (file.size > maxSize) {
      return { 
        isValid: false, 
        error: 'La imagen es demasiado grande. Máximo 5MB' 
      };
    }

    return { isValid: true };
  }

  // Convertir archivo a Base64
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        resolve(e.target.result);
      };
      
      reader.onerror = (error) => {
        reject(new Error('Error al procesar la imagen'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  // Subir múltiples archivos para una receta (se guarda en subcarpeta por receta)
  async uploadMultipleFiles(files: File[], recipeId?: string): Promise<UploadResult> {
    try {
      if (!recipeId) {
        // Si no hay recipeId, generar uno temporal para agrupar las imágenes
        recipeId = uuidv4();
      }

      const uploadPromises = files.map(async (file) => {
        // Validar
        const validation = this.validateImage(file);
        if (!validation.isValid) throw new Error(validation.error);

        // Comprimir si es necesario
        let fileToUpload = file;
        if (file.size > 1024 * 1024) {
          fileToUpload = await this.compressImage(file);
        }

        // Subir al bucket de recetas dentro de la subcarpeta recipeId
        const publicUrl = await this.storage.uploadRecipeImage(fileToUpload, recipeId as string);
        return publicUrl;
      });

      const results = await Promise.all(uploadPromises);

      return {
        success: true,
        data: results
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Subir archivo único
  async uploadFile(file: File, compress: boolean = true, username?: string): Promise<UploadResult> {
    try {
      // Validar archivo
      const validation = this.validateImage(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Comprimir si es necesario
      let fileToUpload = file;
      if (compress && file.size > 1024 * 1024) { // Comprimir si > 1MB
        fileToUpload = await this.compressImage(file);
      }

      // Subir a bucket de avatars. Si no se provee username, se genera uno temporal.
      const userForPath = username && username.trim() ? username.trim() : `tmp-${uuidv4()}`;
      const publicUrl = await this.storage.uploadAvatar(fileToUpload, userForPath);

      return {
        success: true,
        data: publicUrl
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Compresión opcional de imagen
  private compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      if (!ctx) {
        reject(new Error('No se pudo obtener el contexto del canvas'));
        return;
      }

      img.onload = () => {
        const scale = Math.min(maxWidth / img.width, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Error en la compresión'));
              return;
            }
            
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Error al cargar la imagen'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  }
}