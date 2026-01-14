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
  }
];




