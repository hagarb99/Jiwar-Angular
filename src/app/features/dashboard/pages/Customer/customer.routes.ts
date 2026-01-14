import { Routes } from '@angular/router';
import { DashboardCustomerComponent } from './dashboard-customer/dashboard-customer.component';
import { MyBookingComponent } from './my-booking/my-booking.component';

export const CustomerRoutes: Routes = [
  {
    path: '',
    component: DashboardCustomerComponent,
  },
  {
    path: 'MyBooking',
    component: MyBookingComponent
  },
  {
    path: 'chat',
    redirectTo: '/dashboard/chat',
    pathMatch: 'full'
  },
  {
    path: 'chat-room/:propertyId/:customerId',
    loadComponent: () => import('../chat/chat-room/chat-room.component').then(m => m.ChatRoomComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile-customer/profile-customer.component').then(m => m.ProfileCustomerComponent)
  },
  {
    path: 'profile/edit',
    loadComponent: () => import('./profile-customer/edit-profile/edit-profile.component').then(m => m.EditProfileComponent)
  }
];




