import { provideRouter, Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { HomeComponent } from '../app/core/pages/home/home.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent }
]
export const router = provideRouter(routes);

