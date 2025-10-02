import { Injectable, signal, computed } from '@angular/core';
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
        // CORRECCIÓN CLAVE 1:
        // Asegurar que el nombre de usuario no esté vacío para la búsqueda.
        if (!user.username) {
            return { success: false, message: 'Nombre de usuario requerido' };
        }

        let userStr = localStorage.getItem(user.username);

        // CORRECCIÓN CLAVE 2:
        // Verificar si el usuario existe antes de intentar parsear y comparar la contraseña.
        if (userStr) {
            const storedUser = JSON.parse(userStr) as User;
            if (user.password === storedUser.password) {
                sessionStorage.setItem('userLogged', user.username);
                this.verifyLoggedUser();
                return { success: true };
            }
        }

        // Mensaje genérico para seguridad
        return { success: false, message: 'Usuario o contraseña incorrectos' };
    }

    onSignUp(user: User): SignUpResponse {
        // CORRECCIÓN CLAVE 3:
        // Agregar una verificación de seguridad para username.
        if (!user.username) {
            return { success: false, message: 'Nombre de usuario no válido' };
        }

        let userStr = localStorage.getItem(user.username);

        // CORRECCIÓN CLAVE 4:
        // La lógica de verificación de existencia de usuario era correcta, pero la corrección 3 la hace más robusta.
        if (userStr) {
            return { success: false, message: 'Ya existe el Usuario' };
        }

        // Guardar el objeto 'user' completo.
        localStorage.setItem(user.username, JSON.stringify(user));
        sessionStorage.setItem('userLogged', user.username);
        this.verifyLoggedUser();
        return { success: true, redirectTo: 'home' };
    }

    logout() {
        sessionStorage.clear();
        this.verifyLoggedUser();
    }

    // El método getUserLogged no es necesario si se usa el signal currentUsername
    // o el método getCurrentUsername(), pero se deja por compatibilidad.
    getUserLogged() {
        if (sessionStorage.getItem('userLogged')) {
            return { username: sessionStorage.getItem('userLogged')! }
        }
        return { username: 'unknown-user' };
    }

    private verifyLoggedUser() {
        const username = sessionStorage.getItem('userLogged');
        const isLogged = !!username;

        this.isLoged.set(isLogged);

        // Actualizar el signal 'currentUsername'
        if (isLogged && username) {
            this.currentUsername.set(username);

        } else {
            this.currentUsername.set('');
        }
    }

    // MÉTODO NUEVO: Para obtener el username de forma segura
    getCurrentUsername(): string {
        const username = sessionStorage.getItem('userLogged');
        return username || '';
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