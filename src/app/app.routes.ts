import { provideRouter, Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { HomeComponent } from '../app/core/pages/home/home.component';
import { AddPropertyComponent } from './shared/components/add-property/add-property.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
<<<<<<< HEAD
  { path: 'add-property', component: AddPropertyComponent }
=======
  {
    path: 'renovation',
    loadChildren: () => import('./features/renovation/renovation.routes').then(m => m.RENOVATION_ROUTES)
  }
>>>>>>> ce3dbfbf06cb6350d8bf914c65146df445ddcd06
]


export const router = provideRouter(routes);

