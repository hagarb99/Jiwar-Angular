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
        children: [
          {
            path: 'profile',
            loadComponent: () =>
              import('./pages/profile-placeholder/profile-placeholder.component')
                .then(m => m.ProfilePlaceholderComponent)
          }
        ]
      },

      {
        path: 'designer',
        canActivate: [roleGuard(['InteriorDesigner'])],
        loadChildren: () =>
          import('./pages/interiordesigner/interior-designer.routes')
            .then(m => m.interiorDesignerRoutes)
      },

      {
        path: 'propertyowner',
        canActivate: [roleGuard(['PropertyOwner'])],
        loadChildren: () =>
          import('./pages/propertyowner/property-owner.routes')
            .then(m => m.propertyOwnerRoutes)
      },

      {
        path: 'admin',
        canActivate: [roleGuard(['Admin'])],
        loadChildren: () =>
          import('./pages/Admin/admin.routes')
            .then(m => m.ADMIN_ROUTES)
      }
      ,
      {
        path: 'customer',
        canActivate : [roleGuard(['Customer'])],
        loadChildren: ()=>
          import('./pages/Customer/customer.routes').then(m=>m.CustomerRoutes)
      }
    ]
  }
];


// export const DASHBOARD_ROUTES: Routes = [
//   {
//     path: '',
//     component: DashboardLayoutComponent,
//     children: [
//       { 
//         path: 'interiordesigner',
//       {
//         path: 'profile',
//         loadComponent: () => import('./pages/profile-placeholder/profile-placeholder.component').then(m => m.ProfilePlaceholderComponent)
//       },

//       {
//         path: 'designer',
//         canActivate: [roleGuard(['InteriorDesigner'])],
//         loadChildren: () =>
//           import('./pages/interiordesigner/interior-designer.routes')
//             .then(m => m.interiorDesignerRoutes)
//       },

//       // ===== PROPERTY OWNER =====
//       {
//         path: 'propertyowner',
//         canActivate: [roleGuard(['PropertyOwner'])],
//         loadChildren: () =>
//           import('./pages/propertyowner/property-owner.routes')
//             .then(m => m.propertyOwnerRoutes)
//       },

//       // ===== ADMIN =====
//       {
//         path: 'admin',
//         canActivate: [roleGuard(['Admin'])],
//         loadChildren: () =>
//           import('./pages/Admin/admin.routes')
//             .then(m => m.ADMIN_ROUTES)
//       }
//     ]
//   }
// ];
