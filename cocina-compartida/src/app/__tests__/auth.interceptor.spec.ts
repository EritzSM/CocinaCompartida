import { HttpRequest, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { authInterceptor } from '../shared/interceptors/auth.interceptor';

describe('authInterceptor', () => {
  afterEach(() => {
    localStorage.removeItem('token');
  });

  it('AI-01: agrega Authorization Bearer cuando existe token', (done) => {
    localStorage.setItem('token', 'token-qa');
    const request = new HttpRequest('GET', '/api/recipes');

    authInterceptor(request, (handledRequest) => {
      expect(handledRequest.headers.get('Authorization')).toBe('Bearer token-qa');
      return of(new HttpResponse({ status: 200 }));
    }).subscribe(() => done());
  });

  it('AI-02: deja intacta la solicitud cuando no hay token', (done) => {
    const request = new HttpRequest('POST', '/api/recipes', {});

    authInterceptor(request, (handledRequest) => {
      expect(handledRequest.headers.has('Authorization')).toBeFalse();
      expect(handledRequest).toBe(request);
      return of(new HttpResponse({ status: 201 }));
    }).subscribe(() => done());
  });
});
