import { provideRouter, Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
const routes: Routes = [
     { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent }
]
export const router = provideRouter(routes);

