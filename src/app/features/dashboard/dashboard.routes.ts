import { Routes } from '@angular/router';
import { DashboardLayoutComponent } from './dashboard-layout/dashboard-layout.component';
import { roleGuard } from '../../core/guards/role.guard';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: DashboardLayoutComponent,
    children: [

      // ===== INTERIOR DESIGNER =====
      {
        path: 'designer',
        canActivate: [roleGuard(['InteriorDesigner'])],
        loadChildren: () =>
          import('././pages/interiordesigner/interior-designer.routes')
            .then(m => m.INTERIOR_DESIGNER_ROUTES)
      },

      // ===== PROPERTY OWNER =====
      {
        path: 'propertyowner',
        canActivate: [roleGuard(['PropertyOwner'])],
        loadChildren: () =>
          import('./pages/propertyowner/property-owner.routes')
            .then(m => m.propertyOwnerRoutes)
      }
    ]
  }
];
