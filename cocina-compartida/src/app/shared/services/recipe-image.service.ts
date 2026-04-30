import { Injectable, inject } from '@angular/core';
import { UploadService } from './upload';
import { Storage } from './storage';

@Injectable({
  providedIn: 'root'
})
export class RecipeImageService {
  private readonly uploadService = inject(UploadService);
  private readonly storage = inject(Storage);

  images: string[] = [];
  currentIndex = 0;
  isUploading = false;

  readonly MAX_IMAGES = 5;

  async uploadFiles(files: File[], recipeId: string): Promise<boolean | 'limit'> {
    if (!files.length) return false;

    const slotsLeft = this.MAX_IMAGES - this.images.length;
    if (slotsLeft <= 0) return 'limit';

    // Only take as many files as the remaining slots allow
    const allowedFiles = files.slice(0, slotsLeft);

    this.isUploading = true;

    try {
      const result = await this.uploadService.uploadMultipleFiles(allowedFiles, recipeId);
      
      if (result.success && result.data) {
        this.images.push(...result.data as string[]);
        return allowedFiles.length < files.length ? 'limit' : true;
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
