import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SignUp } from '../features/pages/sign-up/sign-up';
import { Auth } from '../shared/services/auth';
import { UploadService } from '../shared/services/upload';
import Swal from 'sweetalert2';

describe('SignUp Component', () => {
  let component: SignUp;
  let fixture: ComponentFixture<SignUp>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockAuth: any;
  let mockUpload: any;

  beforeEach(async () => {
    // Arrange — Spies & Stubs
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockRouter.navigate.and.returnValue(Promise.resolve(true));

    mockAuth = {
      signup: jasmine.createSpy('signup').and.returnValue(
        Promise.resolve({ success: true, token: 'tok', message: '' })
      )
    };

    mockUpload = {
      uploadFile: jasmine.createSpy('uploadFile').and.returnValue(
        Promise.resolve({ success: true, data: 'uploaded-url.jpg' })
      )
    };

    spyOn(Swal, 'fire').and.returnValue(
      Promise.resolve({ isConfirmed: false, isDenied: false, isDismissed: true } as any)
    );

    await TestBed.configureTestingModule({
      imports: [SignUp, ReactiveFormsModule, CommonModule],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: Auth, useValue: mockAuth },
        { provide: UploadService, useValue: mockUpload }
      ]
    }).overrideComponent(SignUp, {
      set: { template: '<div></div>', imports: [ReactiveFormsModule, CommonModule] }
    }).compileComponents();

    fixture = TestBed.createComponent(SignUp);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // SU-01: passwordsMatchValidator retorna null cuando coinciden
  it('SU-01: passwordsMatchValidator returns null when passwords match', () => {
    // Arrange
    component.signUpForm.patchValue({ password: 'pass123', rePassword: 'pass123' });

    // Act
    const result = component.passwordsMatchValidator(component.signUpForm);

    // Assert
    expect(result).toBeNull();
  });

  // SU-02: passwordsMatchValidator retorna error cuando no coinciden
  it('SU-02: passwordsMatchValidator returns {passwordMismatch:true} when mismatch', () => {
    // Arrange
    component.signUpForm.patchValue({ password: 'pass123', rePassword: 'different' });

    // Act
    const result = component.passwordsMatchValidator(component.signUpForm);

    // Assert
    expect(result).toEqual({ passwordMismatch: true });
  });

  // SU-03: togglePasswordVisibility alterna showPassword
  it('SU-03: togglePasswordVisibility toggles showPassword', () => {
    // Arrange
    component.showPassword = false;

    // Act
    component.togglePasswordVisibility('password');

    // Assert
    expect(component.showPassword).toBe(true);

    // Act again
    component.togglePasswordVisibility('password');

    // Assert
    expect(component.showPassword).toBe(false);
  });

  // SU-04: togglePasswordVisibility alterna showrePassword
  it('SU-04: togglePasswordVisibility toggles showrePassword', () => {
    // Arrange
    component.showrePassword = false;

    // Act
    component.togglePasswordVisibility('rePassword');

    // Assert
    expect(component.showrePassword).toBe(true);
  });

  // SU-05: hasError retorna true cuando el control tiene error y fue tocado
  it('SU-05: hasError returns true when control touched and has error', () => {
    // Arrange
    const ctrl = component.signUpForm.get('username');
    ctrl?.markAsTouched();
    ctrl?.setErrors({ required: true });

    // Act
    const result = component.hasError('username', 'required');

    // Assert
    expect(result).toBe(true);
  });

  // SU-06: hasError retorna false cuando el control no fue tocado
  it('SU-06: hasError returns false when control not touched', () => {
    // Arrange — control is untouched by default

    // Act
    const result = component.hasError('username', 'required');

    // Assert
    expect(result).toBe(false);
  });

  // SU-07: removeAvatar resetea al DEFAULT_AVATAR
  it('SU-07: removeAvatar resets to DEFAULT_AVATAR', () => {
    // Arrange
    component.avatarPreview = 'some-url.jpg';

    // Act
    component.removeAvatar();

    // Assert
    expect(component.avatarPreview).toBe(component.DEFAULT_AVATAR);
  });

  // SU-08: onSignUp con passwordMismatch muestra alerta
  it('SU-08: onSignUp with passwordMismatch shows alert', async () => {
    // Arrange
    component.signUpForm.patchValue({
      username: 'testuser', email: 'a@b.com',
      password: 'pass123', rePassword: 'different'
    });

    // Act
    await component.onSignUp();

    // Assert
    expect(Swal.fire).toHaveBeenCalled();
    expect(mockAuth.signup).not.toHaveBeenCalled();
  });

  // SU-09: onSignUp con form inválido muestra alerta
  it('SU-09: onSignUp with invalid form shows alert', async () => {
    // Arrange
    component.signUpForm.patchValue({
      username: '', email: '', password: '', rePassword: ''
    });

    // Act
    await component.onSignUp();

    // Assert
    expect(Swal.fire).toHaveBeenCalled();
  });

  // SU-10: onSignUp exitoso navega a /home
  it('SU-10: onSignUp success navigates to /home', async () => {
    // Arrange
    component.signUpForm.patchValue({
      username: 'testuser', email: 'a@b.com',
      password: 'pass123', rePassword: 'pass123',
      avatar: component.DEFAULT_AVATAR, bio: 'bio'
    });
    // Ensure form is valid
    component.signUpForm.markAllAsTouched();

    // Act
    await component.onSignUp();

    // Assert
    expect(mockAuth.signup).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
  });

  // SU-11: onSignUp fallo muestra alerta
  it('SU-11: onSignUp failure shows alert', async () => {
    // Arrange
    mockAuth.signup.and.returnValue(Promise.resolve({ success: false, message: 'Error' }));
    component.signUpForm.patchValue({
      username: 'testuser', email: 'a@b.com',
      password: 'pass123', rePassword: 'pass123',
      avatar: component.DEFAULT_AVATAR, bio: ''
    });

    // Act
    await component.onSignUp();

    // Assert
    expect(Swal.fire).toHaveBeenCalled();
  });

  // SU-12: onFileSelected sin archivos no sube nada
  it('SU-12: onFileSelected with no files returns early', async () => {
    // Arrange
    const event = { target: { files: null } } as any;

    // Act
    await component.onFileSelected(event);

    // Assert
    expect(mockUpload.uploadFile).not.toHaveBeenCalled();
  });

  // SU-13: onSignUp setea isSubmitting durante la ejecución
  it('SU-13: onSignUp sets isSubmitting false after completion', async () => {
    // Arrange
    component.signUpForm.patchValue({
      username: 'testuser', email: 'a@b.com',
      password: 'pass123', rePassword: 'pass123'
    });

    // Act
    await component.onSignUp();

    // Assert
    expect(component.isSubmitting).toBe(false);
  });

  // SU-14: DEFAULT_AVATAR tiene el valor correcto
  it('SU-14: DEFAULT_AVATAR has correct value', () => {
    // Assert
    expect(component.DEFAULT_AVATAR).toBe('logos/default.webp');
  });
});
