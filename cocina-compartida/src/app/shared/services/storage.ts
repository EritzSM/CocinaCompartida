import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class Storage {
  private http = inject(HttpClient);

  // Upload a single recipe image, returns public URL
  async uploadRecipeImage(imageFile: File, recipeId: string): Promise<string> {
    const fd = new FormData();
    fd.append('files', imageFile);
    const res = await firstValueFrom(this.http.post<{ urls: string[] }>(`/api/uploads/recipes/${recipeId}`, fd));
    return (res.urls && res.urls[0]) || '';
  }

  // Upload avatar, returns public URL
  async uploadAvatar(imageFile: File, username: string): Promise<string> {
    const fd = new FormData();
    fd.append('file', imageFile);
    const q = username ? `?username=${encodeURIComponent(username)}` : '';
    const res = await firstValueFrom(this.http.post<{ url: string }>(`/api/uploads/avatar${q}`, fd));
    return res.url || '';
  }

  // Given a public path or URL, attempt to delete it from the API storage
  async deletePhotoByPublicUrl(publicUrlOrPath: string): Promise<void> {
    try {
      if (!publicUrlOrPath) return;
      // Normalize to path under /uploads
      let path = publicUrlOrPath;
      // If full URL, extract path after /uploads/
      const idx = path.indexOf('/uploads/');
      if (idx !== -1) {
        path = path.substring(idx + '/uploads/'.length);
      }
      // Ensure no leading slash
      path = path.replace(/^\//, '');
      await firstValueFrom(this.http.request('delete', `/api/uploads`, { body: { path } }));
    } catch (e) {
      console.error('Error deleting file via API', e);
      throw e;
    }
  }

  // deleteRecipeImages: attempt to delete a list of image public URLs
  async deleteRecipeImages(recipeId: string, imageUrls: string[] = []): Promise<void> {
    for (const u of imageUrls) {
      await this.deletePhotoByPublicUrl(u);
    }
  }

  // Keep a helper to format public URL if needed
  getPublicUrlForPath(path: string) {
    if (!path) return '';
    if (path.startsWith('/uploads/')) return path;
    return `/uploads/${path.replace(/^\//, '')}`;
  }
}