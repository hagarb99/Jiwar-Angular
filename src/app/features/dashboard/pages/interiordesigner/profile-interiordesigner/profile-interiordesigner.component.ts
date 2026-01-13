import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { ProfileService, InteriorDesigner } from './profile.service';
import { DesignerProposalService } from '../../../../../core/services/designer-proposal.service';
import { DesignService } from '../../../../../core/services/design.service';
import { DesignRequestService } from '../../../../../core/services/design-request.service';
import { DesignerProposal } from '../../../../../core/interfaces/designer-proposal.interface';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { WorkspaceService } from '../../../../../core/services/workspace.service';
import { DesignerReview } from '../../../../../core/interfaces/workspace.interface';
import { forkJoin, of, Subject, takeUntil, Subscription } from 'rxjs';
import { catchError, filter, map, switchMap } from 'rxjs/operators';
import { NotificationService } from '../../../../../core/services/notification.service';
import { PaginatorModule } from 'primeng/paginator';

@Component({
  selector: 'app-profile-interiordesigner',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastModule, PaginatorModule],
  templateUrl: './profile-interiordesigner.component.html',
  styleUrl: './profile-interiordesigner.component.css',
  providers: [MessageService]
})
export class ProfileInteriordesignerComponent implements OnInit, OnDestroy {
  loading = true;
  profile: InteriorDesigner | null = null;
  reviews: any[] = [];
  pagedReviews: any[] = [];
  averageRating: number = 0;
  totalReviews: number = 0;

  // Review expansion tracking
  expandedReviews: Set<number> = new Set();

  // Pagination stats
  rows = 3;
  first = 0;

  private routerSubscription?: Subscription;
  private destroy$ = new Subject<void>();

  constructor(
    private profileService: ProfileService,
    private proposalService: DesignerProposalService,
    private designService: DesignService,
    private designRequestService: DesignRequestService,
    private workspaceService: WorkspaceService,
    private notificationService: NotificationService,
    private messageService: MessageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.fetchProfile();

    this.routerSubscription = this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: any) => {
        if (event.url === '/dashboard/interiordesigner/profile' ||
          event.urlAfterRedirects === '/dashboard/interiordesigner/profile') {
          this.fetchProfile();
        }
      });

    this.notificationService.refresh$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.fetchProfile(false);
      });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchProfile(showLoading = true): void {
    if (showLoading) this.loading = true;

    this.profileService.getProfile().pipe(
      switchMap(profileRaw => {
        // Handle wrapper from backend structure update
        const profile = profileRaw?.interiorDesigner || profileRaw;
        const id = profile?.id || profile?.Id || profileRaw?.id || profileRaw?.Id;

        return forkJoin({
          profile: of(profile),
          proposals: this.proposalService.getMyProposals().pipe(catchError(() => of([]))),
          reviews: id ? this.workspaceService.getDesignerReviews(id).pipe(catchError(() => of({ designerId: '', averageRating: 0, totalReviews: 0, reviews: [] }))) : of({ designerId: '', averageRating: 0, totalReviews: 0, reviews: [] })
        });
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ profile, proposals, reviews }: any) => {
        this.reviews = reviews.reviews || [];
        this.averageRating = reviews.averageRating || 0;
        this.totalReviews = reviews.totalReviews || 0;

        this.updatePagedReviews();

        const totalProposals = (proposals || []).length;
        const acceptedCount = (proposals || []).filter((p: any) =>
          Number(p.status) === 1
        ).length;
        const completedCount = (proposals || []).filter((p: any) =>
          Number(p.status) === 3
        ).length;

        const rawBio = (profile?.bio || profile?.Bio || '').trim();
        const bio = (rawBio === 'No bio information provided yet.') ? '' : rawBio;

        this.profile = {
          name: profile?.name || profile?.Name || '',
          email: profile?.email || profile?.Email || '',
          phoneNumber: profile?.phoneNumber || profile?.PhoneNumber || '',
          profilePicURL: profile?.profilePicURL || profile?.ProfilePicURL || '',
          title: profile?.title || profile?.Title || 'Interior Designer',
          location: profile?.location || profile?.Location || '',
          bio: bio,
          specializations: profile?.specialization ? [profile.specialization] : (Array.isArray(profile?.specializations) ? profile.specializations : (Array.isArray(profile?.Specializations) ? profile.Specializations : [])),
          certifications: Array.isArray(profile?.certifications) ? profile.certifications : (Array.isArray(profile?.Certifications) ? profile.Certifications : []),
          website: profile?.website || '',
          hourlyRate: profile?.hourlyRate ?? null,
          projectMinimum: profile?.projectMinimum ?? null,
          yearsOfExperience: profile?.yearsOfExperience ?? null,
          stats: [
            { label: 'Rating', value: this.averageRating > 0 ? this.averageRating.toFixed(1) + ' ★' : 'No Ratings' },
            { label: 'Total Proposals', value: totalProposals },
            { label: 'Accepted', value: acceptedCount },
            { label: 'Completed', value: completedCount }
          ]
        };

        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching profile:', error);
        this.loading = false;
      }
    });
  }

  onPageChange(event: any) {
    this.first = event.first;
    this.rows = event.rows;
    this.updatePagedReviews();
  }

  updatePagedReviews() {
    this.pagedReviews = this.reviews.slice(this.first, this.first + this.rows);
  }

  isReviewExpanded(reviewId: number): boolean {
    return this.expandedReviews.has(reviewId);
  }

  toggleReview(reviewId: number): void {
    if (this.expandedReviews.has(reviewId)) {
      this.expandedReviews.delete(reviewId);
    } else {
      this.expandedReviews.add(reviewId);
    }
  }

  getTruncatedComment(comment: string, limit: number = 100): string {
    if (!comment) return '';
    if (comment.length <= limit) return comment;
    return comment.substring(0, limit) + '...';
  }

  trackByIndex(index: number, item: any): any {
    return index;
  }
}
