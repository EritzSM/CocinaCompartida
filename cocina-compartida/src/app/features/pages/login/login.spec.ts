import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { Login } from './login';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';
import { Auth } from '../../../shared/services/auth';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

describe('Login Component (Frontend Tests)', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let mockAuthService: any;
  let mockRouter: any;

  beforeEach(async () => {
    // Arrange global (por defecto)
    mockAuthService = {
      login: jasmine.createSpy('login')
    };

    // Espiamos Swal.fire globalmente para evitar modales reales
    spyOn(Swal, 'fire');

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, CommonModule, Login],
      providers: [
        provideRouter([]),
        { provide: Auth, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router);
    spyOn(mockRouter, 'navigate');
    fixture.detectChanges();
  });

  // F-L01: Formulario inválido muestra error Swal y no llama al servicio
  // Uso de Test Double: Spy (Espiando mockAuthService.login y Swal.fire)
  it('F-L01: Formulario inválido muestra error Swal y no llama al servicio', async () => {
    // Arrange
    // Formulario sin datos, por tanto es inválido
    component.loginForm.controls['email'].setValue('');
    component.loginForm.controls['password'].setValue('');

    // Act
    await component.onLogin();

    // Assert
    expect(mockAuthService.login).not.toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
      icon: 'error',
      title: 'Ops!'
    }));
  });

  // F-L02: isLoggingIn bloquea doble envío mientras la petición está en curso
  // Uso de Test Double: Fake (Simulación de servicio con retardo asíncrono)
  it('F-L02: isLoggingIn bloquea doble envío mientras la petición está en curso', fakeAsync(() => {
    // Arrange
    component.loginForm.controls['email'].setValue('usertest@mail.com');
    component.loginForm.controls['password'].setValue('password123');

    // Fake: Imita una latencia en el servidor para permitir probar estados intermedios
    let callCount = 0;
    mockAuthService.login.and.callFake(() => {
      callCount++;
      return new Promise(resolve => {
        setTimeout(() => resolve({ success: true }), 1000);
      });
    });

    // Act
    // Primera llamada (petición a backend)
    component.onLogin();
    
    // Segunda llamada (interceptada tempranamente por el if (this.isLoggingIn))
    component.onLogin();

    // Emulamos el paso del tiempo en el fakeAsync (retardo del servidor)
    tick(1000);

    // Assert
    expect(callCount).toBe(1); // El servicio falso solo se ejecutó una vez
    expect(mockAuthService.login).toHaveBeenCalledTimes(1);

    flush();
  }));

  // F-L03: Login exitoso navega a /home
  // Uso de Test Double: Mock (Router y UserService preparados para éxito esperado)
  it('F-L03: Login exitoso navega a /home', async () => {
    // Arrange
    component.loginForm.controls['email'].setValue('usertest@mail.com');
    component.loginForm.controls['password'].setValue('password123');
    
    // Mock: Reemplazo configurado para emitir respuesta correcta
    mockAuthService.login.and.returnValue(Promise.resolve({ success: true }));

    // Act
    await component.onLogin();

    // Assert
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/home'], { replaceUrl: true });
  });

  // F-L04: Servidor responde success=false -> Swal de error del servidor
  // Uso de Test Double: Stub (Devuelve siempre una respuesta prehecha del servidor)
  it('F-L04: Servidor responde success=false -> Swal de error del servidor', async () => {
    // Arrange
    component.loginForm.controls['email'].setValue('usertest@mail.com');
    component.loginForm.controls['password'].setValue('password123');
    
    // Stub: Configuración rígida sin importar lo que se le pase
    mockAuthService.login.and.returnValue(Promise.resolve({ 
      success: false, 
      message: 'Credenciales inválidas' 
    }));

    // Act
    await component.onLogin();

    // Assert
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
      text: 'Credenciales inválidas',
      icon: 'error'
    }));
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  // F-L05: Error inesperado (catch) muestra Swal y finally resetea isLoggingIn
  // Uso de Test Double: Stub (Fuerza una excepción asíncrona)
  it('F-L05: Error inesperado (catch) muestra Swal y finally resetea isLoggingIn', async () => {
    // Arrange
    component.loginForm.controls['email'].setValue('usertest@mail.com');
    component.loginForm.controls['password'].setValue('password123');
    
    // Stub: Retorna una promesa rechazada
    mockAuthService.login.and.returnValue(Promise.reject(new Error('Network error')));

    // Act
    await component.onLogin();

    // Assert
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
      title: 'Error',
      text: 'Ocurrió un error inesperado'
    }));
    // Por el finally:
    expect(component.isLoggingIn).toBeFalse();
  });

  // F-L06: isLoggingIn siempre vuelve a false en el finally (happy path)
  // Uso de Test Double: Dummy (Mock del router inyectable global no es relevante aquí, solo se rellenan dependencias)
  it('F-L06: isLoggingIn siempre vuelve a false en el finally (happy path)', async () => {
    // Arrange
    component.loginForm.controls['email'].setValue('usertest@mail.com');
    component.loginForm.controls['password'].setValue('password123');
    mockAuthService.login.and.returnValue(Promise.resolve({ success: true }));

    // Act
    const onLoginPromise = component.onLogin();
    
    // Assert - Opcional: vemos que cambia a true justo después de iniciar
    expect(component.isLoggingIn).toBeTrue();
    
    await onLoginPromise;
    
    // Assert - Obligatorio: siempre retorna a false al finalizar exitosamente
    expect(component.isLoggingIn).toBeFalse();
  });
});
