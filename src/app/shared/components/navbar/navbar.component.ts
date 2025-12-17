import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  isLoggedIn = false;

  constructor(private authService: AuthService) {
    this.isLoggedIn = !!this.authService.getToken();
  }
  logout() {
    this.authService.logout();
    this.isLoggedIn = false;
  }
}
