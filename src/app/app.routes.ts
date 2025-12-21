import { provideRouter, Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { HomeComponent } from './features/home/home.component';
import { inject } from '@angular/core';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    canActivate: [() => inject(AuthGuard).canActivate()]
  },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent }
]
export const router = provideRouter(routes);

