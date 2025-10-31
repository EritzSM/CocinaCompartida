// shared/services/auth.ts
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

import { User } from '../interfaces/user';
import { LoginResponse } from '../interfaces/login-response';

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly TOKEN_KEY = 'token';
  // ✅ CORRECCIÓN: Quitamos el prefijo /api/v1 y usamos el puerto base
  private readonly BASE_URL = 'http://localhost:3000'; 

  // Ajusta estos endpoints a tu backend (NestJS)
  private readonly LOGIN_ENDPOINT = `${this.BASE_URL}/auth/login`;
  // ✅ CORRECCIÓN: Apunta a /users (plural)
  private readonly SIGNUP_ENDPOINT = `${this.BASE_URL}/users`; 
  private readonly PROFILE_ENDPOINT = `${this.BASE_URL}/auth/me`; // Se asume el endpoint de verificación

  // señales (las dejo igual para no romper referencias)
  isLoged = signal(false);
  currentUsername = signal<string>('');
  currentUser = signal<User | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.verifyLoggedUser(); // público
  }

  // ---------- HELPERS ----------

  private persistLogin(token: string, user?: Partial<User>) {
    localStorage.setItem(this.TOKEN_KEY, token);
    if (user) {
      // set mínimos seguros (no guardamos password)
      const u: User = {
        id: user.id || '',
        username: user.username || '',
        email: user.email || '',
        avatar: user.avatar,
        bio: user.bio,
        password: '' // nunca guardes password
      };
      this.currentUser.set(u);
      this.currentUsername.set(u.username);
    }
    this.isLoged.set(true);
  }

  // ---------- AUTH API ----------
  async login(credentials: { username: string; password: string }): Promise<LoginResponse> {
    try {
      const res = await lastValueFrom(
        this.http.post<LoginResponse>(this.LOGIN_ENDPOINT, credentials)
      );

      if (res.success && res.token) {
        this.persistLogin(res.token, res.user);
        // ✅ Redirección al home tras login exitoso (clave para el signup)
        this.router.navigate(['/home']); 
      }
      return res;
    } catch (error) {
        let errorMessage = 'Error al intentar iniciar sesión. Revisa tus credenciales.';
        
        // Intenta extraer el mensaje de error de NestJS
        if ((error as any).error && (error as any).error.message) {
            errorMessage = Array.isArray((error as any).error.message)
                ? (error as any).error.message.join(', ')
                : (error as any).error.message;
        }

      return { success: false, message: errorMessage };
    }
  }

  // ✅ CORRECCIÓN de la firma para que coincida con el retorno de login
  async signup(userData: Omit<User, "id"> ): Promise<LoginResponse> { 
    try {
      // 1. POST a /users para crear el usuario
      await lastValueFrom(
        this.http.post(this.SIGNUP_ENDPOINT, userData)
      );

      // 2. Si la creación fue exitosa, procedemos a loguear inmediatamente.
      // Esto resuelve el problema de la redirección, ya que el login la maneja.
      const loginResult = await this.login({
        username: userData.username,
        password: userData.password || ''
      });

      // 3. Devolvemos el resultado del login. Si fue exitoso, el componente 
      //    sabrá que debe redirigir (aunque ya lo hace el método login).
      return loginResult;

    } catch (error: any) {
      // 4. Manejo de error: ej. usuario ya existe.
      console.error('Error durante el registro:', error);

      let errorMessage = 'Error al intentar registrar el usuario';

      // Si el error es una respuesta HTTP (ej. 400 Bad Request),
      if (error.error && error.error.message) {
        errorMessage = Array.isArray(error.error.message)
          ? error.error.message.join(', ')
          : error.error.message;
      }

      // 5. Devolvemos el objeto de error para que el componente de sign-up lo muestre.
      return { 
          success: false, 
          message: errorMessage 
      } as LoginResponse; 
    }
  }

  // 🔓 público y con el mismo nombre/forma que ya usas
  async verifyLoggedUser(): Promise<void> {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      this.logout();
      return;
    }

    try {
      const user = await lastValueFrom(
        this.http.get<User>(this.PROFILE_ENDPOINT)
      );

      this.currentUser.set(user);
      this.currentUsername.set(user.username);
      this.isLoged.set(true);
    } catch {
      this.logout(); // token inválido/expirado
    }
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUser.set(null);
    this.currentUsername.set('');
    this.isLoged.set(false);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.isLoged();
  }

  getUserProfile(): User | null {
    return this.currentUser();
  }

  getCurrentUser(): User | null {
    return this.currentUser();
  }

  getUserId(): string | undefined {
    return this.currentUser()?.id;
  }

  currentAvatar(): string {
    return this.currentUser()?.avatar || 'assets/logos/default-avatar.png';
  }
}