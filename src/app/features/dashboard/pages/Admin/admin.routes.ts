import { Routes } from '@angular/router';
import { OverviewComponent } from './overview/overview.component';

export const ADMIN_ROUTES: Routes = [
    { path: '', redirectTo: 'overview', pathMatch: 'full' },
    { path: 'overview', component: OverviewComponent }
];
