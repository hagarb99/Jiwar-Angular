import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  currentUser: any;
  userEmail: any;
  userRole: any;

  // Filtered menu based on role
  displayedMenuItems: any[] = [];

  constructor(private authService: AuthService) {
    // 1. Get user details from AuthService (which pulls from localStorage or claims)
    this.currentUser = this.authService.getUserName();
    this.userEmail = this.authService.getUserEmail();

    // We need to implement a way to get the role. 
    // Assuming you have it stored in localStorage or can decode it from token.
    // For now, let's try to get it from localStorage if you stored it during login.
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      this.userRole = parsed.role || 'Customer'; // Default to Customer if no role
    } else {
      this.userRole = 'Customer'; // Fallback
    }

    this.updateMenu();
  }

  updateMenu() {
    this.displayedMenuItems = this.menuItems.filter(item => {
      // If no roles defined on item, show to everyone
      if (!item.roles) return true;
      // If user has no role, hide restricted items (or show default)
      if (!this.userRole) return false;
      // check if user's role is in the item's allowed roles
      return item.roles.includes(this.userRole);
    });
  }

  logout() {
    this.authService.logout();
    window.location.reload();
  }

  get userInitials(): string {
    return this.currentUser ? String(this.currentUser).substring(0, 2).toUpperCase() : 'U';
  }

  // Define All possible items with their allowed roles
  // Roles: 'InteriorDesigner', 'PropertyOwner', 'Customer' (assuming Customer ~ Owner)
  menuItems = [
    {
      label: 'Overview',
      path: '/dashboard',
      icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
      roles: ['InteriorDesigner', 'PropertyOwner', 'Customer']
    },
    {
      label: 'My Profile',
      path: '/profile/edit',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      roles: ['InteriorDesigner', 'PropertyOwner', 'Customer']
    },
    {
      label: 'Available Projects',
      path: '/projects',
      icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      roles: ['InteriorDesigner'] // Only designers see available requests
    },
    {
      label: 'My Proposals',
      path: '/proposals',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      roles: ['InteriorDesigner'] // Only designers track their sent proposals here
    },
    {
      label: 'My Requests',
      path: '/my-requests', // You might need to create this route/page
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      roles: ['PropertyOwner', 'Customer'] // Owners track their created requests
    },
    {
      label: 'Active Projects',
      path: '/projects/active',
      icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      roles: ['InteriorDesigner', 'PropertyOwner', 'Customer']
    },
    {
      label: 'Portfolio Manager',
      path: '/portfolio',
      icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
      roles: ['InteriorDesigner']
    },
  ];
}
