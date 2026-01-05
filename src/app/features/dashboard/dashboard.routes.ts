import { Routes } from '@angular/router';
import { DashboardLayoutComponent } from './dashboard-layout/dashboard-layout.component';
import { roleGuard } from '../../core/guards/role.guard';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: DashboardLayoutComponent,
    children: [
      { 
        path: 'interiordesigner',
        canActivate: [roleGuard(['InteriorDesigner'])],
        loadChildren: () =>
          import('./pages/interiordesigner/interior-designer.routes')
            .then(m => m.interiorDesignerRoutes)
      },

      // ===== PROPERTY OWNER =====
      {
        path: 'propertyowner',
        canActivate: [roleGuard(['PropertyOwner'])],
        loadChildren: () =>
          import('./pages/propertyowner/property-owner.routes')
            .then(m => m.propertyOwnerRoutes)
      },

      // ===== ADMIN =====
      {
        path: 'admin',
        canActivate: [roleGuard(['Admin'])],
        loadChildren: () =>
          import('./pages/Admin/admin.routes')
            .then(m => m.ADMIN_ROUTES)
      }
    ]
  }
];
