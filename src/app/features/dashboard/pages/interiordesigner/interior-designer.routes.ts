import { Routes } from '@angular/router';
import { ProfileInteriordesignerComponent } from './profile-interiordesigner/profile-interiordesigner.component';


export const interiorDesignerRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'profile/edit',
    loadComponent: () => import('./profile-interiordesigner/edit-profile/edit-profile.component').then(m => m.EditProfileComponent)
  },
  {
    path: 'profile',
    component: ProfileInteriordesignerComponent
  },
  {
    path: 'available-projects',
    loadComponent: () => import('./available-projects/available-projects.component').then(m => m.AvailableProjectsComponent)
  },
  {
    path: 'my-proposals',
    loadComponent: () => import('./my-proposals/my-proposals.component').then(m => m.MyProposalsComponent)
  },
  {
    path: 'my-designs',
    loadComponent: () => import('./my-designs/my-designs.component').then(m => m.MyDesignsComponent)
  },
  {
    path: 'upload-design',
    loadComponent: () => import('./upload-design/upload-design.component').then(m => m.UploadDesignComponent)
  },
  {
    path: 'active-projects',
    loadComponent: () => import('./active-projects/active-projects.component').then(m => m.ActiveProjectsComponent)
  },
  {
    path: 'earnings',
    loadComponent: () => import('./earnings/earnings.component').then(m => m.EarningsComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./designer-dashboard/designer-dashboard.component').then(m => m.DesignerDashboardComponent)
  }
];




