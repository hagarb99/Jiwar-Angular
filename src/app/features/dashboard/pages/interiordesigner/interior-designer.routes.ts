import { Routes } from '@angular/router';

import { AvailableProjectsComponent } from './available-projects/available-projects.component';
import { MyProposalsComponent } from './my-proposals/my-proposals.component';
import { ActiveProjectsComponent } from './active-projects/active-projects.component';
import { DesignerDashboardComponent } from './designer-dashboard/designer-dashboard.component';

export const INTERIOR_DESIGNER_ROUTES: Routes = [
  { path: 'projects', component: AvailableProjectsComponent },
  { path: 'proposals', component: MyProposalsComponent },
  { path: 'active-projects', component: ActiveProjectsComponent },
  { path: 'dashboard', component: DesignerDashboardComponent },
];
