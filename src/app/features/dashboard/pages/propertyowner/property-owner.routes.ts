import { Routes } from '@angular/router';
import { PropertyOwnerLayoutComponent } from './layout/property-owner-layout.component';
import { PropertyOwnerProfileComponent } from './pages/profile/property-owner-profile.component';

export const propertyOwnerRoutes: Routes = [
  {
    path: '',
    component: PropertyOwnerLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'profile',
        pathMatch: 'full'
      },
      {
        path: 'profile',
        component: PropertyOwnerProfileComponent
      },
      {
        path: 'properties',
        loadComponent: () =>
          import('./pages/properties/property-owner-properties.component')
            .then(component => component.PropertyOwnerPropertiesComponent)
      },
      {
        path: 'bookings',
        loadComponent: () =>
          import('./pages/bookings/property-owner-bookings.component')
            .then(component => component.PropertyOwnerBookingsComponent)
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./pages/analytics/property-owner-analytics.component')
            .then(component => component.PropertyOwnerAnalyticsComponent)
      }
    ]
  }
];
