import { provideRouter, Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { HomeComponent } from '../app/core/pages/home/home.component';
import { AvailableProjectsComponent } from './features/projects/available-projects/available-projects.component';
import { AddPropertyComponent } from './shared/components/add-property/add-property.component';
import { authGuard } from './core/guards/auth.guard';
import { SearchPageComponent } from './core/pages/search-page/search-page.component';
import { roleGuard } from './core/guards/role.guard';
import { DashboardLayoutComponent } from './features/dashboard/dashboard-layout/dashboard-layout.component';
import { PropertyOwnerLayoutComponent } from './features/propertyowner/propertyowner-dashboard/property-owner-layout.component';
import { ProfileInteriordesignerComponent } from './features/dashboard/pages/interiordesigner/profile-interiordesigner/profile-interiordesigner.component';
import { DesignerDashboardComponent } from './features/dashboard/pages/interiordesigner/designer-dashboard/designer-dashboard.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'propertyowner', component: PropertyOwnerLayoutComponent },
  { path: 'projects', component: AvailableProjectsComponent },
  { path: 'add-property', component: AddPropertyComponent, canActivate: [authGuard] },
  {
    path: 'dashboard',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
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
    ]
  }

  // { path: 'propertyowner', component: DashboardLayoutComponent , 
  //   canActivate: [roleGuard(['PropertyOwner'])],
  // children: [
  //     { path: 'profile', component: ProfileComponent },
  //     { path: 'properties', component: PropertiesComponent },
  //     { path: 'analytics', component: AnalyticsComponent },
  //     { path: 'settings', component: SettingsComponent },
  //     { path: '', redirectTo: 'profile', pathMatch: 'full' }
  //   ]
  // }
  ,
  {
    path: 'renovation',
    loadChildren: () => import('./features/renovation/renovation.routes').then(m => m.RENOVATION_ROUTES)
  },
  {
    path: 'properties',
    component: SearchPageComponent
  }
];

export const router = provideRouter(routes);



