import { Routes } from '@angular/router';
import { ProfilePropertyownerComponent } from './profile-propertyowner/profile-propertyowner.component';


export const propertyOwnerRoutes: Routes = [
  {
    path: '',
    redirectTo: 'profile',
    pathMatch: 'full'
  },
  {
    path: 'profile/edit',
    loadComponent: () => import('./profile-propertyowner/edit-profile/edit-profile.component').then(m => m.EditProfilePropertyownerComponent)
  },
  {
    path: 'profile',
    component: ProfilePropertyownerComponent
  },
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
];
