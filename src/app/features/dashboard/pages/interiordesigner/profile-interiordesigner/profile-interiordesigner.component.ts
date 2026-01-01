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

  fetchProfile(): void {
    this.loading = true;
    
    // Fetch profile, proposals, and designs in parallel
    forkJoin({
      profile: this.profileService.getProfile(),
      proposals: this.proposalService.getMyProposals().pipe(
        // Handle errors gracefully - return empty array if proposals fail
        catchError(() => of([]))
      ),
      designs: this.designService.getMyDesigns().pipe(
        // Handle errors gracefully - return empty array if designs fail
        catchError(() => of([]))
      )
    }).subscribe({
      next: ({ profile, proposals, designs }) => {
        console.log('Profile data received from backend:', profile);
        console.log('Specializations:', profile?.specializations);
        console.log('Certifications:', profile?.certifications);
        console.log('Bio:', profile?.bio);
        
        // Calculate stats from real data
        const totalProposals = proposals?.length || 0;
        const acceptedProposals = proposals?.filter(p => p.status === 'Accepted').length || 0;
        const completedDesigns = designs?.length || 0;
        const activeProjects = proposals?.filter(p => 
          p.status === 'Accepted' && !designs?.some(d => d.proposalID === p.id)
        ).length || 0;

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
