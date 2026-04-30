import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Servicio que mantiene el backend de Render despierto
 * haciendo peticiones periódicas al endpoint /app/health
 */
@Injectable({
  providedIn: 'root'
})
export class KeepAliveService implements OnDestroy {
  private intervalId?: number;
  private readonly INTERVAL_MS = 5 * 60 * 1000; // 5 minutos

  constructor(private readonly http: HttpClient) {
    this.startKeepAlive();
  }

  private startKeepAlive(): void {
    this.intervalId = setInterval(() => {
      try {
        this.pingBackend();
      } catch (error) {
        console.warn('[KeepAliveService] Error en petición de health:', error);
      }
    }, this.INTERVAL_MS);
  }

  private pingBackend(): void {
    const backendUrl = '/api/app/health';
    this.http.get(backendUrl, { observe: 'response' })
      .pipe(catchError(error => {
        console.warn(`[KeepAliveService] Backend no responde: ${error.message}`);
        return of(null);
      }))
      .subscribe(
        (response) => {
          if (response?.status === 200) {
            console.log('[KeepAliveService] Backend ping exitoso');
          }
        }
      );
  }

  ngOnDestroy(): void {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
    }
  }
}
