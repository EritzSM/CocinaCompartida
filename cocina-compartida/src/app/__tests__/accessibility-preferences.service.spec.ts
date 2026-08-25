import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AccessibilityPreferencesService } from '../shared/services/accessibility-preferences.service';

describe('AccessibilityPreferencesService', () => {
  let service: AccessibilityPreferencesService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [AccessibilityPreferencesService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AccessibilityPreferencesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('usa preferencias locales para visitantes sin llamar a la API', async () => {
    localStorage.setItem(
      'cocina-accessibility-preferences',
      JSON.stringify({ readingAssistantEnabled: true, speechRate: 1.5 }),
    );

    const result = await service.load();

    expect(result.readingAssistantEnabled).toBeTrue();
    expect(result.speechRate).toBe(1.5);
    http.expectNone('/api/users/me/accessibility');
  });

  it('sincroniza las preferencias del usuario autenticado', async () => {
    localStorage.setItem('token', 'valid-token');
    const promise = service.load();
    const request = http.expectOne('/api/users/me/accessibility');
    expect(request.request.method).toBe('GET');
    request.flush({
      readingAssistantEnabled: true,
      autoReadEnabled: true,
      speechRate: 1.25,
      preferredVoice: 'Voz española',
    });

    await expectAsync(promise).toBeResolvedTo({
      readingAssistantEnabled: true,
      autoReadEnabled: true,
      speechRate: 1.25,
      preferredVoice: 'Voz española',
    });
  });

  it('guarda primero localmente y actualiza el backend', async () => {
    localStorage.setItem('token', 'valid-token');
    const promise = service.update({ speechRate: 2 });
    const request = http.expectOne('/api/users/me/accessibility');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ speechRate: 2 });
    request.flush({
      readingAssistantEnabled: false,
      autoReadEnabled: false,
      speechRate: 2,
      preferredVoice: null,
    });

    const result = await promise;
    expect(result.speechRate).toBe(2);
    expect(localStorage.getItem('cocina-accessibility-preferences')).toContain('"speechRate":2');
  });

  it('carga la configuración remota si el usuario inicia sesión sin recargar', async () => {
    await service.load();
    localStorage.setItem('token', 'new-session-token');

    const promise = service.load();
    const request = http.expectOne('/api/users/me/accessibility');
    request.flush({
      readingAssistantEnabled: true,
      autoReadEnabled: false,
      speechRate: 1.5,
      preferredVoice: null,
    });

    expect((await promise).readingAssistantEnabled).toBeTrue();
  });
});
