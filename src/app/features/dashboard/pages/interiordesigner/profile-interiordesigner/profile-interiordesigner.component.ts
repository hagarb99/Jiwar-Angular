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
import { environment } from '../../../../../../environments/environment';

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
        if (event.url === '/dashboard/designer/profile' ||
          event.urlAfterRedirects === '/dashboard/designer/profile') {
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
        const totalProposals = (proposals || []).length;
        const acceptedProposals = (proposals || []).filter((p: any) => p.status === 'Accepted' || p.status === 'Completed' || p.status === '1').length;
        const completedDesigns = (designs || []).length;
        const activeProjects = (proposals || []).filter((p: any) => p.status === 'Accepted').length;

        // الحصول على بيانات المصمم الإضافية من الكائن المتداخل (Nested Object)
        const designerData = profile.interiorDesigner || {};

        this.profile = {
          name: profile.name || '',
          email: profile.email || '',
          phoneNumber: profile.phoneNumber || '',
          profilePicURL: this.getProfileImageUrl(profile.profilePicURL),
          title: profile.title || 'Interior Designer',
          location: profile.location || '',
          bio: profile.bio || '',
          // استخدام البيانات من الكائن المتداخل للـ Designer

          yearsOfExperience: designerData.experienceYears || designerData.yearsOfExperience || null,

          // معالجة التخصص (Specialization)
          specializations: designerData.specialization ? [designerData.specialization] :
            (Array.isArray(designerData.specializations) ? designerData.specializations : []),

          certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
          website: designerData.portfolioURL || '',
          hourlyRate: profile.hourlyRate || null,
          projectMinimum: profile.projectMinimum || null,
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

  getProfileImageUrl(url: string | null): string {
    if (!url) return '';
    if (url.startsWith('data:image')) return url;
    if (url.startsWith('http')) return url;

    // Construct absolute URL for server images
    const base = environment.apiBaseUrl.replace(/\/api\/?$/, '');
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  trackByIndex(index: number, item: any): any {
    return index;
  }
}
