// services/upload.service.ts
import { Injectable } from '@angular/core';
import { UploadResult } from '../interfaces/upload-result';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
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

  // Subir múltiples archivos
  async uploadMultipleFiles(files: File[]): Promise<UploadResult> {
    try {
      const base64Promises = files.map(file => this.uploadFile(file));
      const results = await Promise.all(base64Promises);
      const successfulUploads = results.filter(result => result.success) as { success: true; data: string }[];
      
      return {
        success: true,
        data: successfulUploads.map(result => result.data)
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Subir archivo único
  async uploadFile(file: File, compress: boolean = true): Promise<UploadResult> {
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

      // Convertir a Base64
      const base64Data = await this.fileToBase64(fileToUpload);
      
      return {
        success: true,
        data: base64Data
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