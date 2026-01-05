import { Routes } from '@angular/router';
import { OverviewComponent } from './overview/overview.component';
import { UsersListComponent } from './users/users-list/users-list.component';
import { PropertiesListComponent } from './properties/properties-list/properties-list.component';
import { WishlistListComponent } from './wishlist/wishlist-list/wishlist-list.component';

export const ADMIN_ROUTES: Routes = [
    { path: '', redirectTo: 'overview', pathMatch: 'full' },
    { path: 'overview', component: OverviewComponent },
    { path: 'users', component: UsersListComponent },
    { path: 'properties', component: PropertiesListComponent },
    { path: 'wishlist', component: WishlistListComponent }
];
