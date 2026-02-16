// shared/services/auth.ts
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

import { User } from '../interfaces/user';
import { LoginResponse } from '../interfaces/login-response';

type JwtPayload = {
  sub?: string;
  id?: string;
  username?: string;
  email?: string;
  url?: string;    // avatar en tu token
  exp?: number;    // segundos UNIX
  [k: string]: any;
};

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly TOKEN_KEY = 'token';
  private readonly BASE_URL = '/api';

  private readonly LOGIN_ENDPOINT = `${this.BASE_URL}/auth/login`;
  private readonly SIGNUP_ENDPOINT = `${this.BASE_URL}/users`;

  isLoged = signal(false);
  currentUsername = signal<string>('');
  currentUser = signal<User | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.verifyLoggedUser(); 
  }


  private decodeJwt<T = JwtPayload>(token: string): T | null {
    try {
      const [, payload] = token.split('.');
      if (!payload) return null;
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decodeURIComponent(escape(json)));
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeJwt<JwtPayload>(token);
    if (!payload?.exp) return false; // si no hay exp, asumimos no expirado (o manéjalo como inválido)
    const nowSec = Math.floor(Date.now() / 1000);
    return payload.exp <= nowSec;
  }

  private payloadToUser(payload: JwtPayload): User {
    return {
      id: payload.sub || payload.id || '',
      username: payload.username || '',
      email: payload.email || '',
      avatar: payload.url, 
      bio: '',
      password: '' 
    };
  }

  private persistLogin(token: string, userFromResponse?: Partial<User>) {
    localStorage.setItem(this.TOKEN_KEY, token);
    let u: User | null = null;
    if (userFromResponse?.id) {
      u = {
        id: userFromResponse.id,
        username: userFromResponse.username || '',
        email: userFromResponse.email || '',
        avatar: userFromResponse.avatar,
        bio: userFromResponse.bio,
        password: ''
      } as User;
    } else {
      const payload = this.decodeJwt<JwtPayload>(token);
      if (payload) u = this.payloadToUser(payload);
    }

    if (u) {
      this.currentUser.set(u);
      this.currentUsername.set(u.username);
      this.isLoged.set(true);
    }
  }

  // ---------------- API ----------------
  async login(credentials: { username: string; password: string }): Promise<LoginResponse> {
    try {
      const res = await lastValueFrom(
        this.http.post<LoginResponse>(this.LOGIN_ENDPOINT, credentials)
      );

      if (res.success && res.token) {
        this.persistLogin(res.token, res.user);
        await this.router.navigate(['/home'], { replaceUrl: true });
      }
      return res;
    } catch (error: any) {
      let message = 'Error al intentar iniciar sesión. Revisa tus credenciales.';
      if (error?.error?.message) {
        message = Array.isArray(error.error.message) ? error.error.message.join(', ') : error.error.message;
      }
      return { success: false, message } as LoginResponse;
    }
  }

  async signup(userData: Omit<User, 'id'>): Promise<LoginResponse> {
    try {
      // 1) Crea el usuario
      await lastValueFrom(this.http.post(this.SIGNUP_ENDPOINT, userData));

      // 2) Autologin
      const loginResult = await this.login({
        username: userData.username,
        password: userData.password || ''
      });

      return loginResult;
    } catch (error: any) {
      let message = 'Error al intentar registrar el usuario';
      if (error?.error?.message) {
        message = Array.isArray(error.error.message) ? error.error.message.join(', ') : error.error.message;
      }
      return { success: false, message } as LoginResponse;
    }
  }

  async verifyLoggedUser(): Promise<void> {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      this.logout(false);
      return;
    }

    if (this.isTokenExpired(token)) {
      this.logout(false);
      return;
    }

    const payload = this.decodeJwt<JwtPayload>(token);
    if (!payload || !(payload.sub || payload.id)) {
      this.logout(false);
      return;
    }

    const u = this.payloadToUser(payload);
    this.currentUser.set(u);
    this.currentUsername.set(u.username);
    this.isLoged.set(true);
  }

  logout(redirect = true): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUser.set(null);
    this.currentUsername.set('');
    this.isLoged.set(false);
    if (redirect) this.router.navigate(['/login']);
  }
  
  isAuthenticated(): boolean { return this.isLoged(); }
  getCurrentUser(): User | null { return this.currentUser(); }
  getUserProfile(): User | null { return this.currentUser(); }
  getUserId(): string | undefined { return this.currentUser()?.id; }
  currentAvatar(): string { return this.currentUser()?.avatar || 'assets/logos/default-avatar.png'; }
}
