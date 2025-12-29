import { provideRouter, Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { HomeComponent } from '../app/core/pages/home/home.component';
import { AddPropertyComponent } from './shared/components/add-property/add-property.component';
import { authGuard } from './core/guards/auth.guard';
import { SearchPageComponent } from './core/pages/search-page/search-page.component';
import { roleGuard } from './core/guards/role.guard';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'add-property', component: AddPropertyComponent, canActivate: [authGuard] },
   {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../app/features/dashboard/dashboard.routes')
        .then(m => m.DASHBOARD_ROUTES)
  },
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



