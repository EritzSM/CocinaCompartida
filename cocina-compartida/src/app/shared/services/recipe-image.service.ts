import { Injectable, inject } from '@angular/core';
import { UploadService } from './upload';
import { Storage } from './storage';

@Injectable({
  providedIn: 'root'
})
export class RecipeImageService {
  private uploadService = inject(UploadService);
  private storage = inject(Storage);

  images: string[] = [];
  currentIndex = 0;
  isUploading = false;

  async uploadFiles(files: File[], recipeId: string): Promise<boolean> {
    if (!files.length) return false;

    this.isUploading = true;

    try {
      const result = await this.uploadService.uploadMultipleFiles(files, recipeId);
      
      if (result.success && result.data) {
        this.images.push(...result.data as string[]);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      this.isUploading = false;
    }
  }

  async removeImage(index: number): Promise<void> {
    if (index < 0 || index >= this.images.length) return;

    const url = this.images[index];

    try {
      await this.storage.deletePhotoByPublicUrl(url);
    } catch (e) {
      console.error('No se pudo eliminar la imagen del bucket:', e);
    }

    this.images.splice(index, 1);
    this.adjustCurrentIndex();
  }

  private adjustCurrentIndex(): void {
    if (this.currentIndex >= this.images.length) {
      this.currentIndex = Math.max(0, this.images.length - 1);
    }
  }

  navigateImages(direction: 'next' | 'prev'): void {
    if (this.images.length === 0) return;

    if (direction === 'next') {
      this.currentIndex = (this.currentIndex + 1) % this.images.length;
    } else {
      this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    }
  }

  resetImages(): void {
    this.images = [];
    this.currentIndex = 0;
  }
}