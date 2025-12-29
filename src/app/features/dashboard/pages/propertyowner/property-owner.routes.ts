import { Routes } from '@angular/router';
import { DashboardLayoutComponent } from '../../dashboard-layout/dashboard-layout.component';


export const propertyOwnerRoutes: Routes = [
  {
    path: '',
    component: DashboardLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'profile',
        pathMatch: 'full'
      },
      // {
      //   path: 'profile',
      //   component: PropertyOwnerProfileComponent
      // },
      // {
      //   path: 'properties',
      //   loadComponent: () =>
      //     import('./pages/properties/property-owner-properties.component')
      //       .then(component => component.PropertyOwnerPropertiesComponent)
      // },
      // {
      //   path: 'bookings',
      //   loadComponent: () =>
      //     import('./pages/bookings/property-owner-bookings.component')
      //       .then(component => component.PropertyOwnerBookingsComponent)
      // },
      // {
      //   path: 'analytics',
      //   loadComponent: () =>
      //     import('./pages/analytics/property-owner-analytics.component')
      //       .then(component => component.PropertyOwnerAnalyticsComponent)
      // }
    ]
  }
];
