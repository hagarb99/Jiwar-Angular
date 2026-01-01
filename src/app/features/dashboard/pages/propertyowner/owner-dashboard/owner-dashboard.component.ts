import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DesignRequestService } from '../../../../../core/services/design-request.service';
import { ProfileService, PropertyOwnerProfile } from '../profile.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { DesignRequest } from '../../../../../core/interfaces/design-request.interface';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './owner-dashboard.component.html',
  styleUrls: ['./owner-dashboard.component.css'],
})
export class OwnerDashboardComponent implements OnInit {

  overviewStats = [
    { label: 'Total Requests', value: '0', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', bg: 'bg-white' },
    { label: 'Active Projects', value: '0', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', bg: 'bg-blue-100' },
    { label: 'My Properties', value: '0', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', bg: 'bg-white' },
    { label: 'Pending Proposals', value: '0', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', bg: 'bg-white' },
  ];

  profile: PropertyOwnerProfile | null = null;
  requests: DesignRequest[] = [];
  loading = true;

  constructor(
    private designRequestService: DesignRequestService,
    private profileService: ProfileService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading = true;
    
    // Load profile
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        if (profile.stats && profile.stats.length > 0) {
          // Update stats from profile if available
          const propertiesStat = profile.stats.find(s => s.label === 'Properties');
          if (propertiesStat) {
            this.overviewStats[2].value = propertiesStat.value.toString();
          }
        }
      },
      error: (err) => {
        console.error('Error loading profile:', err);
      }
    });

    // Load design requests
    this.designRequestService.getMyDesignRequests().subscribe({
      next: (requests) => {
        this.requests = requests;

        // Update stats
        this.overviewStats[0].value = requests.length.toString();
        
        // Count active projects (accepted requests)
        const activeCount = requests.filter(r => r.status === 'Accepted' || r.status === 'InProgress').length;
        this.overviewStats[1].value = activeCount.toString();
        
        // Count pending proposals (open requests)
        const pendingCount = requests.filter(r => r.status === 'Open').length;
        this.overviewStats[3].value = pendingCount.toString();

        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load design requests', err);
        this.loading = false;
      }
    });
  }

  getCurrentUser() {
    try {
      const userJson = localStorage.getItem('currentUser');
      return userJson ? JSON.parse(userJson) : {};
    } catch {
      return {};
    }
  }

  getStatusSeverity(status: string): string {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'info';
      case 'accepted':
      case 'inprogress':
        return 'success';
      case 'completed':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  }
}

