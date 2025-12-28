import { Component, OnInit , inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface SidebarMenuItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements OnInit{
  private authService = inject(AuthService);

  userName = '';
  userEmail = '';
  userRole = '';

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

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      return;
    }

    this.userName = currentUser.name;
    this.userEmail = currentUser.email;
    this.userRole = currentUser.role;

    if (currentUser.role === 'PropertyOwner') {
      this.menuItems = [
        {
          label: 'Dashboard',
          path: '/propertyowner/dashboard',
          icon: 'M3 12l2-2 7-7 7 7 2 2v8a2 2 0 01-2 2h-3'
        },
        {
          label: 'My Properties',
          path: '/propertyowner/properties',
          icon: 'M4 6h16M4 10h16M4 14h16M4 18h16'
        },
        {
          label: 'Add Property',
          path: '/propertyowner/add-property',
          icon: 'M12 4v16m8-8H4'
        }
      ];
    }
  }

   logout(): void {
    this.authService.logout();
  location.href = '/login';
  
  }
  
  
}
