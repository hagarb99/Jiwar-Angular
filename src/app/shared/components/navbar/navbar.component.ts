import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { OnInit } from '@angular/core';
import {
  LucideAngularModule,
  ChevronDown,
  Menu,
  X,
  Globe
} from 'lucide-angular';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    LucideAngularModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  toggleUserDropdown = false;  // ← NEW: لفتح/غلق الـ dropdown

profilePicUrl: string | null = null;
currentUserName: string | null = null;
currentUserEmail: string | null = null;

  readonly ChevronDown = ChevronDown;
  readonly Menu = Menu;
  readonly X = X;
  readonly Globe = Globe;

  // State
  mobileMenuOpen = false;
  activeDropdown: 'buy' | 'invest' | 'sell' | 'renovation' | null = null;
  language: 'EN' | 'AR' = 'EN';
  currentPath = '';
  isLoggedIn = false;

  buyDropdownItems = [
    { path: '/properties', label: 'Apartments for Sale' },
    { path: '/properties?type=rent', label: 'Apartments for Rent' },
    { path: '/properties?type=new', label: 'New Developments' },
    { path: '/properties?type=virtual', label: 'Virtual Tour Properties (360°)' },
    { path: '/comparison', label: 'Compare Properties' },
    { path: '/properties?featured=true', label: 'Featured Properties' }
  ];

  investDropdownItems = [
    { path: '/investment', label: 'Investment Opportunities' },
    { path: '/calculator', label: 'ROI Calculator' },
    { path: '/investment#plans', label: 'Investment Plans' },
    { path: '/analytics', label: 'Market Insights' }
  ];

  renovationDropdownItems = [
    { path: '/renovation/intro', label: 'Start Simulation' },
    { path: '/renovation/intro', label: 'Upload Apartment Media' },
    { path: '/renovation/intro', label: 'View Recommendations' }
  ];

  sellDropdownItems = [
    { path: '/add-property', label: 'Sell Your Property' },
    { path: '/sell/rental', label: 'Rent Property' }
  ];

  constructor(private router: Router,
    private authService: AuthService
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(event => {
        this.currentPath = (event as NavigationEnd).urlAfterRedirects;
      });
  }

  
  setDropdown(name: 'buy' | 'invest' | 'sell' | 'renovation' | null): void {
    this.activeDropdown = name;
  }

  toggleLanguage(): void {
    this.language = this.language === 'EN' ? 'AR' : 'EN';
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }
 ngOnInit(): void {
    // Listen to login status changes
    this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
      if (status) {
        this.profilePicUrl = this.authService.getProfilePicUrl();
      this.currentUserName = this.authService.getUserName();
      this.currentUserEmail = this.authService.getUserEmail();
      } else {
        this.profilePicUrl = null;
      this.currentUserName = null;
      this.currentUserEmail = null;
      }
    });
    if (this.authService.isLoggedIn()) {
    this.profilePicUrl = this.authService.getProfilePicUrl();
    this.currentUserName = this.authService.getUserName();
    this.currentUserEmail = this.authService.getUserEmail();
  }
  }  

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

}
