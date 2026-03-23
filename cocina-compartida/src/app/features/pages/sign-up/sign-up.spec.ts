import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { SignUp } from './sign-up';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';
import { Auth } from '../../../shared/services/auth';
import { UploadService } from '../../../shared/services/upload';
import Swal from 'sweetalert2';

describe('SignUp Component (Frontend Tests)', () => {
  let component: SignUp;
  let fixture: ComponentFixture<SignUp>;
  let mockAuthService: any;
  let mockRouter: any;
  let mockUploadService: any;

  beforeEach(async () => {
    // Definición global de mocks
    mockAuthService = {
      signup: jasmine.createSpy('signup')
    };
    mockUploadService = {
      uploadFile: jasmine.createSpy('uploadFile')
    };

    spyOn(Swal, 'fire');

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, SignUp],
      providers: [
        provideRouter([]),
        FormBuilder,
        { provide: Auth, useValue: mockAuthService },
        { provide: UploadService, useValue: mockUploadService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SignUp);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router);
    spyOn(mockRouter, 'navigate');
    fixture.detectChanges();
  });

  // F-S01: Formulario inválido muestra Swal y no llama al servicio
  // Uso de Test Double: Spy (Espía interno sobre signup y Swal confirmando ausencias/presencias)
  it('F-S01: Formulario inválido muestra Swal y no llama al servicio', async () => {
    // Arrange
    // Formulario por defecto está vacío e inválido
    component.signUpForm.patchValue({
      username: '',
      email: '',
      password: '',
      rePassword: ''
    });

    // Act
    await component.onSignUp();

    // Assert
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
      text: 'Por favor complete todos los campos requeridos correctamente'
    }));
    expect(mockAuthService.signup).not.toHaveBeenCalled();
  });

  // F-S02: Error passwordMismatch muestra alerta específica
  // Uso de Test Double: Dummy (Un form payload que intencionalmente es incompatible)
  it('F-S02: Error passwordMismatch muestra alerta específica', async () => {
    // Arrange
    // Dummy: Rellenar campos válidos pero con contraseñas que no hacen match para disparar error custom
    component.signUpForm.patchValue({
      username: 'usuario',
      email: 'usuario@test.com',
      password: 'password123',
      rePassword: 'diferentepassword'
    });

    // Act
    await component.onSignUp();

    // Assert
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
      text: 'Las contraseñas no coinciden'
    }));
  });

  // F-S03: Avatar vacío usa DEFAULT_AVATAR
  // Uso de Test Double: Mock (Validamos el parámetro modificado en la aserción tras invocar un stub)
  it('F-S03: Avatar vacío usa DEFAULT_AVATAR', async () => {
    // Arrange
    component.signUpForm.patchValue({
      username: 'usuario',
      email: 'usuario@test.com',
      password: 'password123',
      rePassword: 'password123',
      avatar: '' // Probamos enviarlo vacío programáticamente
    });
    
    // Mock
    mockAuthService.signup.and.returnValue(Promise.resolve({ success: true }));

    // Act
    await component.onSignUp();

    // Assert
    expect(mockAuthService.signup).toHaveBeenCalledWith(jasmine.objectContaining({
      avatar: component.DEFAULT_AVATAR
    }));
  });

  // F-S04: Registro exitoso muestra toast y navega a /home
  // Uso de Test Double: Mock (Router navigate esperado al recibir true)
  it('F-S04: Registro exitoso muestra toast y navega a /home', async () => {
    // Arrange
    component.signUpForm.patchValue({
      username: 'usuario',
      email: 'usuario@test.com',
      password: 'password123',
      rePassword: 'password123'
    });
    // Mock router y service para camino de éxito
    mockAuthService.signup.and.returnValue(Promise.resolve({ success: true }));

    // Act
    await component.onSignUp();

    // Assert
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
      title: '¡Registro exitoso!',
      toast: true
    }));
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
  });

  // F-S05: res.success=false muestra mensaje del servidor
  // Uso de Test Double: Stub (Se prepara authService estáticamente para devolver un fracaso preenlatado)
  it('F-S05: res.success=false muestra mensaje del servidor', async () => {
    // Arrange
    component.signUpForm.patchValue({
      username: 'usuario',
      email: 'usuario@test.com',
      password: 'password123',
      rePassword: 'password123'
    });
    const serverMessage = 'Email ya registrado';
    // Stub
    mockAuthService.signup.and.returnValue(Promise.resolve({ success: false, message: serverMessage }));

    // Act
    await component.onSignUp();

    // Assert
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
      text: serverMessage
    }));
  });

  // F-S06: Error inesperado (catch) muestra Swal genérico
  // Uso de Test Double: Stub (Lanza error forzoso asíncrono)
  it('F-S06: Error inesperado (catch) muestra Swal genérico', async () => {
    // Arrange
    component.signUpForm.patchValue({
      username: 'usuario',
      email: 'usuario@test.com',
      password: 'password123',
      rePassword: 'password123'
    });
    
    // Stub
    mockAuthService.signup.and.returnValue(Promise.reject(new Error('Network error')));

    // Act
    await component.onSignUp();

    // Assert
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
      text: 'Ocurrió un error inesperado. Por favor intente nuevamente.'
    }));
  });

  // F-S07: isSubmitting vuelve a false en el finally
  // Uso de Test Double: Fake (Retarda el mock de auth service para probar los hilos de isSubmitting)
  it('F-S07: isSubmitting vuelve a false en el finally', fakeAsync(() => {
    // Arrange
    component.signUpForm.patchValue({
      username: 'usuario',
      email: 'usuario@test.com',
      password: 'password123',
      rePassword: 'password123'
    });
    
    // Fake
    mockAuthService.signup.and.callFake(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve({ success: true }), 1000);
      });
    });

    // Act
    component.onSignUp();
    
    expect(component.isSubmitting).toBeTrue();
    
    tick(1000); // Simulamos el paso asíncrono

    // Assert
    expect(component.isSubmitting).toBeFalse();

    flush();
  }));
});
