import { provideRouter, Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ChangePasswordComponent } from './features/auth/change-password/change-password.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';
import { HomeComponent } from './core/pages/home/home.component';
import { AvailableProjectsComponent } from './features/projects/available-projects/available-projects.component';
import { AddPropertyComponent } from './shared/components/add-property/add-property.component';
import { authGuard } from './core/guards/auth.guard';
import { SearchPageComponent } from './core/pages/search-page/search-page.component';
import { PropertyDetailsComponent } from './core/pages/property-details/property-details.component';
import { WishlistComponent } from './core/pages/wishlist/wishlist.component';
import { SubscriptionListComponent } from './features/subscription/subscription-list/subscription-list.component';

import { ChatComponent } from './shared/components/chat/chat.component';
import { PropertyOwnerPublicProfileComponent } from './features/dashboard/pages/propertyowner/profile-propertyowner/property-owner-public-profile/property-owner-public-profile.component';
const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'change-password', component: ChangePasswordComponent, canActivate: [authGuard] },
  { path: 'projects', component: AvailableProjectsComponent },
  { path: 'add-property', component: AddPropertyComponent, canActivate: [authGuard] },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../app/features/dashboard/dashboard.routes')
        .then(m => m.DASHBOARD_ROUTES)
  },
  { path: 'subscriptions', component: SubscriptionListComponent },
  { path: 'chat', component: ChatComponent },
  {path: 'propertyowner/:userId', component: PropertyOwnerPublicProfileComponent},
  // {
  //   path: 'propertyowner',
  //   canActivate: [roleGuard(['PropertyOwner'])],
  //   children: [
  //     { path: '', component: OwnerDashboardComponent },
  //     { path: 'properties', component: PropertiesComponent },
  //     { path: 'add-property', component: AddPropertyComponent }
  //   ]
  // }
  // ,
  // {
  //   path: 'designer',
  //   canActivate: [roleGuard(['Designer'])],
  //   children: [
  //     { path: '', component: DesignerDashboardComponent }
  //   ]
  // }
  // ,
  // {
  //   path: 'customer',
  //   canActivate: [roleGuard(['Customer'])],
  //   children: [
  //     { path: '', component: CustomerDashboardComponent }
  //   ]
  // }
  // ,
  // {
  //   path: 'admin',
  //   canActivate: [roleGuard(['Admin'])],
  //   children: [
  //     { path: '', component: AdminDashboardComponent }
  //   ]
  // }

  // { path: 'propertyowner', component: DashboardLayoutComponent , 
  //   canActivate: [roleGuard(['PropertyOwner'])],
  // children: [
  //     { path: 'profile', component: ProfileComponent },
  //     { path: 'properties', component: PropertiesComponent },
  //     { path: 'analytics', component: AnalyticsComponent },
  //     { path: 'settings', component: SettingsComponent },
  //     { path: '', redirectTo: 'profile', pathMatch: 'full' }
  //   ]
  // },
  {
    path: 'renovation',
    loadChildren: () => import('./features/renovation/renovation.routes').then(m => m.RENOVATION_ROUTES)
  },
  {
    path: 'properties',
    component: SearchPageComponent
  },
  {
    path: 'property-details/:id',
    component: PropertyDetailsComponent
  },
  {
    path: 'wishlist',
    component: WishlistComponent
  },
  {
    path: 'subscriptions',
    loadComponent: () => import('./features/subscription/subscription-list/subscription-list.component').then(m => m.SubscriptionListComponent)
  }
];

export const router = provideRouter(routes);



