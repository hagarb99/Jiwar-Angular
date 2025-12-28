import { provideRouter, Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { HomeComponent } from '../app/core/pages/home/home.component';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { DashboardComponent } from './features/designer/dashboard/dashboard.component';
import { ProfileEditingComponent } from './features/designer/profile-editing/profile-editing.component';
import { AvailableProjectsComponent } from './features/projects/available-projects/available-projects.component';

import { AddPropertyComponent } from './shared/components/add-property/add-property.component';
import { authGuard } from './core/guards/auth.guard';
import { SearchPageComponent } from './core/pages/search-page/search-page.component';
const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'profile/edit', component: ProfileEditingComponent },
  { path: 'projects', component: AvailableProjectsComponent },
  { path: 'add-property', component: AddPropertyComponent, canActivate: [authGuard] },
  {
    path: 'renovation',
    loadChildren: () => import('./features/renovation/renovation.routes').then(m => m.RENOVATION_ROUTES)
  },
  {
    path: 'properties',
    component: SearchPageComponent
  },
];

export const router = provideRouter(routes);



