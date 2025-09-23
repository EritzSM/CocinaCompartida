import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class Header {

  constructor(private router: Router) {}

  goToLogin() {
    this.router.navigate(['/login']); // Ajusta según tu ruta de login
  }
}
