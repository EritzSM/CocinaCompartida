import { Injectable, signal } from '@angular/core';
import { User } from '../interfaces/user';
import { LoginRespose, SignUpResponse } from '../interfaces/login-response';

@Injectable({
    providedIn: 'root'
})
export class Auth {
    isLoged = signal(false);
    currentUsername = signal<string>('');
    
    constructor() {
        this.verifyLoggedUser();
    }

    login(user: User): LoginRespose {
        if (!user.username) {
            return { success: false, message: 'Nombre de usuario requerido' };
        }

        const userStr = localStorage.getItem(user.username);
        
        if (userStr) {
            const storedUser = JSON.parse(userStr) as User;
            if (user.password === storedUser.password) {
                sessionStorage.setItem('userLogged', user.username);
                this.verifyLoggedUser();
                return { success: true };
            }
        }
        
        return { success: false, message: 'Usuario o contraseña incorrectos' };
    }

    onSignUp(user: User): SignUpResponse {
        if (!user.username) {
            return { success: false, message: 'Nombre de usuario no válido' };
        }

        const userStr = localStorage.getItem(user.username);

        if (userStr) {
            return { success: false, message: 'Ya existe el Usuario' };
        }

        localStorage.setItem(user.username, JSON.stringify(user));
        sessionStorage.setItem('userLogged', user.username);
        this.verifyLoggedUser();
        return { success: true, redirectTo: 'home' };
    }

    logout() {
        sessionStorage.clear();
        this.verifyLoggedUser();
    }

    private verifyLoggedUser() {
        const username = sessionStorage.getItem('userLogged');
        const isLogged = !!username;

        this.isLoged.set(isLogged);
        
        if (isLogged && username) {
            this.currentUsername.set(username);
        } else {
            this.currentUsername.set('');
        }
    }

    getCurrentUser(): User | null {
        const username = sessionStorage.getItem('userLogged');
        if (!username) return null;

        const userStr = localStorage.getItem(username);
        return userStr ? JSON.parse(userStr) as User : null;
    }

    currentAvatar(): string {
        return this.getCurrentUser()?.avatar || "assets/logos/default-avatar.png";
    }
}