import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, ButtonModule],
    template: `
    <div style="padding: 50px; text-align: center;">
      <h1>Welcome to Jiwar</h1>
      <p>You are successfully logged in!</p>
      <p-button label="Logout" (onClick)="logout()"></p-button>
    </div>
  `
})
export class HomeComponent {
    constructor(private authService: AuthService, private router: Router) { }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
