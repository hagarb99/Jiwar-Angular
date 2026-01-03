import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { ProfileService, InteriorDesigner } from './profile.service';
import { DesignerProposalService } from '../../../../../core/services/designer-proposal.service';
import { DesignService } from '../../../../../core/services/design.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { forkJoin, of } from 'rxjs';
import { catchError, filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile-interiordesigner',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastModule],
  templateUrl: './profile-interiordesigner.component.html',
  styleUrl: './profile-interiordesigner.component.css',
  providers: [MessageService]
})
export class ProfileInteriordesignerComponent implements OnInit, OnDestroy {
  loading = true;
  profile: InteriorDesigner | null = null;
  private routerSubscription?: Subscription;

  constructor(
    private profileService: ProfileService,
    private proposalService: DesignerProposalService,
    private designService: DesignService,
    private messageService: MessageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.fetchProfile();
    
    // Reload profile when navigating back from edit page
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        // If we're on the profile page and coming from edit page, reload data
        if (event.url === '/dashboard/interiordesigner/profile' || 
            event.urlAfterRedirects === '/dashboard/interiordesigner/profile') {
          this.fetchProfile();
        }
      });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  mapStatus(val: any): string {
      if (val === undefined || val === null) return 'Pending';
      if (typeof val === 'string') return val;
      switch (val) {
          case 0: return 'Pending';
          case 1: return 'Accepted';
          case 2: return 'Rejected';
          case 3: return 'Completed';
          default: return 'Pending';
      }
  }

  fetchProfile(): void {
    this.loading = true;
    
    // Fetch profile, proposals, and designs in parallel
    forkJoin({
      profile: this.profileService.getProfile(),
      proposals: this.proposalService.getMyProposals().pipe(
        catchError(() => of([]))
      ),
      designs: this.designService.getMyDesigns().pipe(
        catchError(() => of([]))
      )
    }).subscribe({
      next: ({ profile, proposals, designs }) => {
        console.log('Profile data received from backend:', profile);
        
        // Normalize proposal data (PascalCase -> camelCase) using mapStatus
        const normalizedProposals = (proposals || []).map((p: any) => ({
             ...p,
             id: p.id || p.Id,
             status: this.mapStatus(p.status || p.Status || p.proposalStatus?.toString()),
             designRequestID: p.designRequestID || p.DesignRequestID || p.requestID || p.RequestID
        }));

        // Calculate stats from real data
        const totalProposals = normalizedProposals.length;
        const acceptedProposals = normalizedProposals.filter(p => p.status === 'Accepted').length;
        const completedDesigns = designs?.length || 0;
        const activeProjects = normalizedProposals.filter(p => 
          p.status === 'Accepted' && !designs?.some(d => d.proposalID === p.id)
        ).length;

        // Map backend data to our interface with proper defaults
        this.profile = {
          name: profile?.name || '',
          email: profile?.email || '',
          phoneNumber: profile?.phoneNumber || '',
          profilePicURL: profile?.profilePicURL || '',
          title: profile?.title || 'Interior Designer',
          location: profile?.location || '',
          bio: profile?.bio || '',
          specializations: Array.isArray(profile?.specializations) ? profile.specializations : [],
          certifications: Array.isArray(profile?.certifications) ? profile.certifications : [],
          website: profile?.website || '',
          hourlyRate: profile?.hourlyRate ?? null,
          projectMinimum: profile?.projectMinimum ?? null,
          yearsOfExperience: profile?.yearsOfExperience ?? null,
          stats: [
            { label: 'Total Proposals', value: totalProposals },
            { label: 'Accepted Proposals', value: acceptedProposals },
            { label: 'Completed Designs', value: completedDesigns },
            { label: 'Active Projects', value: activeProjects }
          ]
        };
        
        console.log('Mapped profile data:', this.profile);
        console.log('Specializations count:', this.profile.specializations.length);
        console.log('Certifications count:', this.profile.certifications.length);
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching profile:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Failed to load profile data. Please try again later.'
        });
        this.loading = false;
      }
    });
  }

  trackByIndex(index: number, item: any): any {
    return index;
  }
}
