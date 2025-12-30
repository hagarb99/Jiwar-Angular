import { Routes } from '@angular/router';

import { AvailableProjectsComponent } from './available-projects/available-projects.component';
import { MyProposalsComponent } from './my-proposals/my-proposals.component';
import { ActiveProjectsComponent } from './active-projects/active-projects.component';
import { DesignerDashboardComponent } from './designer-dashboard/designer-dashboard.component';
import { ProfilePropertyownerComponent } from '../propertyowner/profile-propertyowner/profile-propertyowner.component';

export const interiorDesignerRoutes: Routes = [
  { path: '', redirectTo: 'designer-dashboard.component', pathMatch: 'full' }

];


