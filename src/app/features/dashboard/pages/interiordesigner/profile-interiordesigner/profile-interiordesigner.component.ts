import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { ProfileService, InteriorDesigner } from './profile.service';
import { DesignerProposalService } from '../../../../../core/services/designer-proposal.service';
import { DesignService } from '../../../../../core/services/design.service';
import { DesignRequestService } from '../../../../../core/services/design-request.service';
import { DesignerProposal } from '../../../../../core/interfaces/designer-proposal.interface'; // Ensure interface availability
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { forkJoin, of } from 'rxjs';
import { catchError, filter, map, switchMap } from 'rxjs/operators';
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
    private designRequestService: DesignRequestService,
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
    this.profileService.getProfile().pipe(
      switchMap(profile => {
        return forkJoin({
          profile: of(profile),
          proposals: this.proposalService.getMyProposals().pipe(catchError(() => of([]))),
          designs: this.designService.getMyDesigns().pipe(catchError(() => of([])))
        });
      }),
      switchMap(({ profile, proposals, designs }) => {
        // Now verify pending proposals status
        const pendingProposals = proposals.filter((p: any) => p.status === 'Pending' || p.status === '0');

        if (pendingProposals.length === 0) {
          return of({ profile, proposals, designs });
        }

        const checks = pendingProposals.map((prop: any) =>
          this.designRequestService.getDesignRequestById(prop.designRequestID).pipe(
            map(req => {
              if (req.status === 'InProgress' || req.status === 'Active' || req.status === 'Completed') {
                prop.status = 'Accepted';
              }
              return prop;
            }),
            catchError(() => of(prop))
          )
        );

        return forkJoin(checks).pipe(
          map(() => ({ profile, proposals, designs }))
        );
      })
    ).subscribe({
      next: ({ profile, proposals, designs }) => {
        // Calculate stats from real data
        const totalProposals = (proposals || []).length;
        // Re-filter now that statuses might be updated
        const acceptedProposals = (proposals || []).filter((p: any) => p.status === 'Accepted' || p.status === 'Completed').length;
        const completedDesigns = (designs || []).length;

        // Active projects: accepted proposals that don't have a submitted design yet
        // However, if your business logic says 'Active' is 'Accepted', user might just want 'Accepted' count.
        // Let's stick to "Active" usually means "In Progress" for the designer.

        const activeProposalsList = (proposals || []).filter((p: any) =>
          p.status === 'Accepted'
        );

        // Filter out those that already have a design linked? 
        // For simplicity and to match the user's "Active Projects" page which lists Accepted proposals:
        const activeProjects = activeProposalsList.length;

        // Update profile object
        this.profile = {
          name: profile?.name || profile?.Name || '',
          email: profile?.email || profile?.Email || '',
          phoneNumber: profile?.phoneNumber || profile?.PhoneNumber || '',
          profilePicURL: profile?.profilePicURL || profile?.ProfilePicURL || profile?.avatarUrl || profile?.AvatarUrl || '',
          title: profile?.title || profile?.Title || 'Interior Designer',
          location: profile?.location || profile?.Location || '',
          bio: profile?.bio || profile?.Bio || '',
          specializations: profile?.specialization ? [profile.specialization] :
            (profile?.Specialization ? [profile.Specialization] :
              (Array.isArray(profile?.specializations) ? profile.specializations :
                (Array.isArray(profile?.Specializations) ? profile.Specializations : []))),
          certifications: Array.isArray(profile?.certifications) ? profile.certifications :
            (Array.isArray(profile?.Certifications) ? profile.Certifications : []),
          website: profile?.website || profile?.Website || profile?.portfolioUrl || profile?.PortfolioUrl || '',
          hourlyRate: profile?.hourlyRate ?? profile?.HourlyRate ?? null,
          projectMinimum: profile?.projectMinimum ?? profile?.ProjectMinimum ?? null,
          yearsOfExperience: profile?.yearsOfExperience ?? profile?.YearsOfExperience ?? null,
          stats: [
            { label: 'Total Proposals', value: totalProposals },
            { label: 'Accepted Proposals', value: acceptedProposals },
            { label: 'Completed Designs', value: completedDesigns },
            { label: 'Active Projects', value: activeProjects }
          ]
        };

        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching profile:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load profile data.'
        });
        this.loading = false;
      }
    });
  }

  trackByIndex(index: number, item: any): any {
    return index;
  }
}
