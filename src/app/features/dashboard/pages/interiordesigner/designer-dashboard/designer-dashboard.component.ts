import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DesignerProposalService } from '../../../../../core/services/designer-proposal.service';
import { DesignService } from '../../../../../core/services/design.service';
import { ProfileService } from '../profile-interiordesigner/profile.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { WorkspaceService } from '../../../../../core/services/workspace.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { DesignRequestService } from '../../../../../core/services/design-request.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './designer-dashboard.component.html',
  styleUrls: ['./designer-dashboard.component.css'],
})
export class DesignerDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  overviewStats: any[] = [
    { label: 'Total Proposals', value: '0', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', bg: 'bg-white' },
    { label: 'Active Projects', value: '0', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', bg: 'bg-amber-100' },
    { label: 'Completed', value: '0', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', bg: 'bg-white' },
    { label: 'Overall Rating', value: '0.0', sub: '0 reviews', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', bg: 'bg-white' },
  ];

  financials = [
    { label: 'Current Balance', value: '$0', main: true },
    { label: 'Pending', value: '$0', main: false },
    { label: 'Withdrawn', value: '$0', main: false },
  ];

  profile: any = null;
  proposals: any[] = [];
  activeProjects: any[] = [];
  loading = true;

  constructor(
    private proposalService: DesignerProposalService,
    private designService: DesignService,
    private profileService: ProfileService,
    private authService: AuthService,
    private workspaceService: WorkspaceService,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    this.loadDashboardData();

    // Listen for real-time notification refreshes
    this.notificationService.refresh$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('🔄 Real-time refresh triggered for Dashboard');
        this.loadDashboardData(false);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(showLoading = true) {
    if (showLoading) this.loading = true;

    // 1. Fetch Profile & Ratings
    this.profileService.getProfile().pipe(takeUntil(this.destroy$)).subscribe({
      next: (profileRaw) => {
        // Handle wrapper from backend structure update
        const profile = profileRaw?.interiorDesigner || profileRaw;
        this.profile = profile;
        const designerId = profile?.id || profile?.Id || profileRaw?.id || profileRaw?.Id;

        if (designerId) {
          this.workspaceService.getDesignerReviews(designerId).pipe(takeUntil(this.destroy$)).subscribe({
            next: (reviewData) => {
              this.overviewStats[3].value = (reviewData.averageRating || 0).toFixed(1);
              this.overviewStats[3].sub = `${reviewData.totalReviews || 0} reviews`;
            },
            error: (err) => console.error('Error fetching dashboard ratings:', err)
          });
        }
      },
      error: (err) => console.error('Error loading profile:', err)
    });

    // 2. Fetch Proposals (Stat logic aligned with numeric status: 0:Pending, 1:Accepted, 2:Rejected, 3:Completed)
    this.proposalService.getMyProposals().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: any[]) => {
        this.proposals = data.map(p => ({
          id: p.id,
          title: `Request #${p.designRequestID || 'N/A'}`,
          client: p.designerName || 'Client',
          price: `${p.estimatedCost} SAR`,
          statusDisplay: this.getStatusLabel(p.status),
          status: Number(p.status)
        }));

        this.overviewStats[0].value = data.length.toString(); // Total
        this.overviewStats[1].value = data.filter(p => Number(p.status) === 1).length.toString(); // Active / Accepted
        this.overviewStats[2].value = data.filter(p => Number(p.status) === 3).length.toString(); // Completed / Delivered

        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load proposals', err);
        this.loading = false;
      }
    });

    // 3. Fetch Designs
    this.designService.getMyDesigns().pipe(takeUntil(this.destroy$)).subscribe({
      next: (designs: any[]) => {
        if (designs && designs.length > 0) {
          this.activeProjects = designs.map(d => ({
            title: `Design #${d.id}`,
            client: 'Property Owner',
            progress: d.status === 'Final' ? 100 : 75,
            date: d.creationDate ? new Date(d.creationDate).toLocaleDateString() : 'N/A'
          }));
        }
      },
      error: (err) => console.error('Failed to load designs:', err)
    });
  }

  getStatusLabel(status: any): string {
    switch (Number(status)) {
      case 0: return 'Pending';
      case 1: return 'Accepted';
      case 2: return 'Rejected';
      case 3: return 'Delivered';
      default: return 'Pending';
    }
  }

  getCurrentUser() {
    try {
      const userJson = localStorage.getItem('currentUser');
      return userJson ? JSON.parse(userJson) : {};
    } catch {
      return {};
    }
  }
}
