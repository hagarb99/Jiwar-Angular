import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../../features/dashboard/sidebar/sidebar.component';

@Component({
  selector: 'app-property-owner-layout',
  standalone: true,
  imports: [SidebarComponent, RouterOutlet],
  template: `
    <div class="flex min-h-screen bg-gray-50">
      <app-sidebar></app-sidebar>

      <main class="flex-1 ml-64 p-8">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class PropertyOwnerLayoutComponent {}
