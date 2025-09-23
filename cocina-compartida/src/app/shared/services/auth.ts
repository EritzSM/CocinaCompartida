import { Injectable, signal } from '@angular/core';
import { User } from '../interfaces/user';
import { LoginRespose, SignUpResponse } from '../interfaces/login-response';

@Injectable({
    providedIn: 'root'
})
export class Auth {

    isLoged = signal(false);

    constructor(){
        this.verifyLoggedUser();
    }

    login(user: User): LoginRespose {

        let userStr = localStorage.getItem(user.username);
        if (userStr && user.password === JSON.parse(userStr).password) {
            sessionStorage.setItem('userLogged', user.username);
            this.verifyLoggedUser();
            return { success: true };
        }
        return { success: false, message: 'Usuario o contraseña incorrectos' };

    }


    onSignUp(user: User): SignUpResponse {

        let userStr = localStorage.getItem(user.username!);
        if (userStr) {
            return { success: false, message: 'Ya existe el Usuario' };
        }
        localStorage.setItem(user.username!, JSON.stringify(user));
        sessionStorage.setItem('userLogged', user.username);
        this.verifyLoggedUser();
        return { success: true, redirectTo: 'home' };
    }

    logout(){
        sessionStorage.clear();
        this.verifyLoggedUser();
    }

    getUserLogged(){
        if(sessionStorage.getItem('userLogged')){
            return { username: sessionStorage.getItem('userLogged')!}
        }
        return {username:'unknown-user'};
    }

    private verifyLoggedUser(){
        this.isLoged.set(!!sessionStorage.getItem('userLogged'))

    }

}