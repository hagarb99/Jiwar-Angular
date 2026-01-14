import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../../../core/services/auth.service';
import { ProfileService, InteriorDesigner } from './profile.service';
import { DesignerProposalService } from '../../../../../core/services/designer-proposal.service';
import { DesignService } from '../../../../../core/services/design.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { WorkspaceService } from '../../../../../core/services/workspace.service';
import { forkJoin, of, Subject, Subscription } from 'rxjs';
import { catchError, filter, takeUntil, switchMap } from 'rxjs/operators';
import { NotificationService } from '../../../../../core/services/notification.service';
import { PaginatorModule } from 'primeng/paginator';
import { environment } from '../../../../../../environments/environment';

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

  expandedReviews: Set<number> = new Set();
  rows = 3;
  first = 0;

  private routerSubscription?: Subscription;
  private destroy$ = new Subject<void>();

  displayImage: string = ''; // Local variable for forcing UI refresh

  constructor(
    private profileService: ProfileService,
    private proposalService: DesignerProposalService,
    private designService: DesignService,
    private workspaceService: WorkspaceService,
    private notificationService: NotificationService,
    private messageService: MessageService,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // 1. Fetch full profile data
    this.fetchProfile();

    // 2. Listen to Auth changes to sync Image/Name instantly (e.g. after upload)
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          // Update local display image if Auth user updates
          if (user.profilePicURL) {
            console.log('🔄 Auth User Update:', user.profilePicURL);
            this.displayImage = this.getProfileImageUrl(user.profilePicURL);
            if (this.profile) {
              this.profile.profilePicURL = user.profilePicURL;
            }
          }
        }
      });

    this.routerSubscription = this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: any) => {
        if (event.url.includes('/dashboard/interiordesigner/profile') ||
          event.url.includes('/dashboard/designer/profile')) {
          this.fetchProfile(false);
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
        console.log('🔍 Full API Response:');
        console.dir(profileRaw); // requested console.dir

        // Handle possible nested structures
        const profile = profileRaw?.interiorDesigner || profileRaw?.result || profileRaw;
        const id = profile?.id || profileRaw?.id;

        return forkJoin({
          profile: of(profile),
          proposals: this.proposalService.getMyProposals().pipe(catchError(() => of([]))),
          designs: this.designService.getMyDesigns().pipe(catchError(() => of([]))),
          reviews: id ? this.workspaceService.getDesignerReviews(id).pipe(
            catchError(() => of({ averageRating: 0, totalReviews: 0, reviews: [] }))
          ) : of({ averageRating: 0, totalReviews: 0, reviews: [] })
        });
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ profile, proposals, designs, reviews }: any) => {
        this.reviews = reviews.reviews || [];
        this.averageRating = reviews.averageRating || 0;
        this.totalReviews = reviews.totalReviews || 0;
        this.updatePagedReviews();

        const totalProposals = (proposals || []).length;
        const acceptedCount = (proposals || []).filter((p: any) => Number(p.status) === 1).length;
        const completedCount = (proposals || []).filter((p: any) => Number(p.status) === 3).length;

        const designerData = profile.interiorDesigner || {};

        // 🛡️ Defensive URL Extraction
        // Check all possible locations: root, interiorDesigner object, user object, different casing
        let rawUrl = profile?.profilePicURL
          || profile?.interiorDesigner?.profilePicURL
          || profile?.user?.profilePicURL
          || (profile as any)?.profilePicUrl
          || (profile?.interiorDesigner as any)?.profilePicUrl;

        console.log('📸 Extracted Raw URL (API):', rawUrl);

        // 🚨 Fallback: If API image is missing, check AuthService (Navbar source)
        if (!rawUrl) {
          const authUser = this.authService.getCurrentUserValue();
          if (authUser && authUser.profilePicURL) {
            rawUrl = authUser.profilePicURL;
            console.log('📸 Using Fallback URL from AuthService:', rawUrl);
          }
        }

        // Update Display Image
        this.displayImage = this.getProfileImageUrl(rawUrl);

        this.profile = {
          name: profile?.name || '',
          email: profile?.email || '',
          phoneNumber: profile?.phoneNumber || '',
          profilePicURL: rawUrl, // Store extracted/fallback URL
          title: profile?.title || 'Interior Designer',
          location: profile?.location || '',
          bio: (profile?.bio === 'No bio information provided yet.') ? '' : (profile?.bio || ''),

          yearsOfExperience: designerData.experienceYears || profile.yearsOfExperience || null,
          specializations: designerData.specialization ? [designerData.specialization] :
            (Array.isArray(profile.specializations) ? profile.specializations : []),
          certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
          website: designerData.portfolioURL || profile.website || '',
          hourlyRate: profile.hourlyRate || null,
          projectMinimum: profile.projectMinimum || null,

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

  // --- ميثودات المراجعات (Reviews) التي كانت تسبب الأخطاء ---

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

  // --- ميثودات مساعدة ---

  getProfileImageUrl(url: string | null | undefined): string {
    if (!url) {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.profile?.name || 'Jiwar'}`;
    }

    // إذا كان الرابط خارجياً (مثل صور جوجل)
    if (url.startsWith('http') || url.startsWith('data:image')) {
      return url;
    }

    // تنظيف apiBaseUrl للحصول على الدومين الرئيسي (مثلاً http://localhost:5001)
    const base = environment.apiBaseUrl.replace(/\/api\/?$/, '');

    // التأكد من أن المسار يبدأ بـ /
    const path = url.startsWith('/') ? url : `/${url}`;

    const finalUrl = `${base}${path}`;
    console.log('🚀 Processed URL for UI:', finalUrl);
    return finalUrl;
  }

  trackByIndex(index: number): any { return index; }
}