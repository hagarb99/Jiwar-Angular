import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { DesignRequestService } from '../../../../../core/services/design-request.service';
import { DesignerProposalService } from '../../../../../core/services/designer-proposal.service';
import { DesignService } from '../../../../../core/services/design.service';
import { DesignRequest } from '../../../../../core/interfaces/design-request.interface';
import { DesignerProposal } from '../../../../../core/interfaces/designer-proposal.interface';
import { Design } from '../../../../../core/interfaces/design.interface';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { NotificationService } from '../../../../../core/services/notification.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-design-request-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ToastModule,
    ButtonModule,
    CardModule,
    TagModule,
    ProgressSpinnerModule,
    DialogModule
  ],
  templateUrl: './design-request-details.component.html',
  styleUrls: ['./design-request-details.component.css']
})
export class DesignRequestDetailsComponent implements OnInit, OnDestroy {
  requestId!: number;
  designRequest: DesignRequest | null = null;
  proposals: DesignerProposal[] = [];
  submittedDesigns: Design[] = [];
  loading = true;
  showProposalDialog = false;
  selectedProposal: DesignerProposal | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private designRequestService: DesignRequestService,
    private proposalService: DesignerProposalService,
    private designService: DesignService,
    private notificationService: NotificationService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    // Listen for route parameter changes
    this.route.params.pipe(
      map(params => +params['id']),
      takeUntil(this.destroy$)
    ).subscribe(id => {
      this.requestId = id;
      this.initData(id);
    });

    // Listen for real-time notification refreshes
    this.notificationService.refresh$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('🔄 Real-time refresh triggered for Request Details');
        if (this.requestId) {
          this.initData(this.requestId, false);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initData(id: number, showLoading = true): void {
    if (showLoading) this.loading = true;

    forkJoin({
      request: this.designRequestService.getDesignRequestById(id).pipe(
        catchError(err => {
          console.error('Error loading request:', err);
          return of(null);
        })
      ),
      proposals: this.proposalService.getProposalsForRequest(id).pipe(
        catchError(err => {
          console.error('Error loading proposals:', err);
          return of([] as DesignerProposal[]);
        })
      )
    }).subscribe({
      next: ({ request, proposals }) => {
        if (!request) {
          if (showLoading) this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load request.' });
          this.loading = false;
          return;
        }

        this.designRequest = request;
        // Backend now returns numeric status correctly: 0 (Pending), 1 (Accepted), 2 (Rejected), 3 (Completed)
        this.proposals = proposals.map(p => ({
          ...p,
          status: Number(p.status)
        }));

        if (request.propertyID) {
          this.loadSubmittedDesigns(request.propertyID);
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Error in data init:', err);
        this.loading = false;
      }
    });
  }

  loadSubmittedDesigns(propertyId: number): void {
    this.designService.getDesignsByProperty(propertyId).subscribe({
      next: (designs) => {
        this.submittedDesigns = designs;
      },
      error: (err) => console.error('Error loading designs:', err)
    });
  }

  getStatusSeverity(status: string | number): string {
    if (status === null || status === undefined) return 'info';

    // Check if it's a numeric status (usually for Proposals)
    const s = Number(status);
    if (!isNaN(s)) {
      if (s === 1 || s === 3) return 'success';
      if (s === 2) return 'danger';
      return 'info';
    }

    // It's a string status (usually for DesignRequests like 'InProgress')
    const lower = String(status).toLowerCase();
    if (lower.includes('accept') || lower.includes('progress') || lower.includes('complete') || lower.includes('delivered') || lower.includes('final')) {
      return 'success';
    }
    if (lower.includes('reject') || lower.includes('cancel')) {
      return 'danger';
    }
    return 'info';
  }

  getStatusLabel(status: any): string {
    const s = Number(status);
    switch (s) {
      case 0: return 'Pending';
      case 1: return 'Accepted';
      case 2: return 'Rejected';
      case 3: return 'Delivered';
      default: return 'Pending';
    }
  }

  hasAcceptedProposal(): boolean {
    return this.proposals.some(p => Number(p.status) === 1 || Number(p.status) === 3);
  }

  canManageProposal(proposal: DesignerProposal): boolean {
    // Can only manage if status is Pending (0) AND no other proposal is accepted/completed
    return Number(proposal.status) === 0 && !this.hasAcceptedProposal();
  }

  viewProposalDetails(proposal: DesignerProposal): void {
    this.selectedProposal = proposal;
    this.showProposalDialog = true;
  }

  chooseProposal(proposalId: number): void {
    this.proposalService.chooseProposal(proposalId).subscribe({
      next: (updatedProposals) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Accepted',
          detail: 'Proposal accepted! Redirecting to workspace...'
        });
        this.proposals = updatedProposals;
        this.initData(this.requestId, false); // Refresh request state
        this.showProposalDialog = false;

        setTimeout(() => {
          this.router.navigate(['/dashboard/workspace', this.requestId]);
        }, 1500);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to accept proposal.' });
      }
    });
  }

  rejectProposal(proposalId: number): void {
    this.proposalService.rejectProposal(proposalId).subscribe({
      next: (updatedProposals) => {
        this.messageService.add({ severity: 'info', summary: 'Rejected', detail: 'Proposal rejected.' });
        this.proposals = updatedProposals;
        this.showProposalDialog = false;
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to reject proposal.' });
      }
    });
  }

  closeDialog(): void {
    this.showProposalDialog = false;
    this.selectedProposal = null;
  }
}
