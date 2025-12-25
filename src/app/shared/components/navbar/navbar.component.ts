import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import {
  LucideAngularModule,
  ChevronDown,
  Menu,
  X,
  Globe
} from 'lucide-angular';

import { ButtonModule } from 'primeng/button';

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
export class NavbarComponent {
  readonly ChevronDown = ChevronDown;
  readonly Menu = Menu;
  readonly X = X;
  readonly Globe = Globe;

  // State
  mobileMenuOpen = false;
  activeDropdown: 'buy' | 'invest' | 'renovation' | null = null;
  language: 'EN' | 'AR' = 'EN';
  currentPath = '';

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

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(event => {
        this.currentPath = (event as NavigationEnd).urlAfterRedirects;
      });
  }

  setDropdown(name: 'buy' | 'invest' | 'renovation' | null): void {
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

}
