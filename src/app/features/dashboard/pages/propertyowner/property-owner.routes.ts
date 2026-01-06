import { Routes } from '@angular/router';
import { ProfilePropertyownerComponent } from './profile-propertyowner/profile-propertyowner.component';
import { OwnerMyPropertiesComponent } from './owner-my-properties/owner-my-properties.component';
import { OwnerBookingsComponent } from './owner-bookings/owner-bookings.component';

export const propertyOwnerRoutes: Routes = [
  {
    path: 'dashboard',
    redirectTo: 'property-dashboard',
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
  {
    path: 'my-properties',
    component: OwnerMyPropertiesComponent
  },
  {
    path : 'my-Booking',
    component: OwnerBookingsComponent
  },
  {
    path: 'edit-property/:id',
    loadComponent: () => import('./edit-property/edit-property.component').then(m => m.EditPropertyComponent)
  },
  {  
    path: 'dashboard',
    loadComponent: () => import('./property-dashboard/property-dashboard.component').then(m => m.PropertyDashboardComponent)
  },
  {
    path: 'design-requests/create',
    loadComponent: () => import('./create-design-request/create-design-request.component').then(m => m.CreateDesignRequestComponent)
  },
  {
    path: 'design-requests/:id',
    loadComponent: () => import('./design-request-details/design-request-details.component').then(m => m.DesignRequestDetailsComponent)
  },
  {
    path: 'browse-designers',
    loadComponent: () => import('./browse-designers/browse-designers.component').then(m => m.BrowseDesignersComponent)
  },
  {
    path: 'my-requests',
    loadComponent: () => import('./my-requests/my-requests.component').then(m => m.MyRequestsComponent)
  },
  {
    path: 'design-requests',
    redirectTo: 'my-requests',
    pathMatch: 'full'
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
