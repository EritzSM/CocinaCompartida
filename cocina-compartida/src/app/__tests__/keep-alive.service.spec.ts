import { TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { KeepAliveService } from '../shared/services/keep-alive.service';

describe('KeepAliveService', () => {
  let service: KeepAliveService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [KeepAliveService],
    });

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    if (service) {
      service.ngOnDestroy();
    }
    httpMock.verify();
  });

  it('KA-01: hace ping al backend cuando se cumple el intervalo', fakeAsync(() => {
    spyOn(console, 'log');
    service = TestBed.inject(KeepAliveService);

    tick(5 * 60 * 1000 + 1);

    const req = httpMock.expectOne('/api/app/health');
    expect(req.request.method).toBe('GET');
    req.flush(null, { status: 200, statusText: 'OK' });

    expect(console.log).toHaveBeenCalledWith('[KeepAliveService] Backend ping exitoso');
    service.ngOnDestroy();
    discardPeriodicTasks();
  }));

  it('KA-02: controla errores del ping sin propagar excepciones', fakeAsync(() => {
    spyOn(console, 'warn');
    service = TestBed.inject(KeepAliveService);

    (service as any).pingBackend();

    const req = httpMock.expectOne('/api/app/health');
    req.flush(null, { status: 503, statusText: 'Service Unavailable' });

    expect(console.warn).toHaveBeenCalled();
    service.ngOnDestroy();
    discardPeriodicTasks();
  }));

  it('KA-03: detiene el intervalo al destruir el servicio', fakeAsync(() => {
    service = TestBed.inject(KeepAliveService);
    service.ngOnDestroy();

    tick(5 * 60 * 1000);

    httpMock.expectNone('/api/app/health');
    expect(httpMock.match('/api/app/health').length).toBe(0);
    discardPeriodicTasks();
  }));
});
