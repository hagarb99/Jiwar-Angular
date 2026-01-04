import { Component, OnInit } from '@angular/core';
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
  providers: [MessageService],
  templateUrl: './design-request-details.component.html',
  styleUrls: ['./design-request-details.component.css']
})

export class DesignRequestDetailsComponent implements OnInit {
  requestId!: number;
  designRequest: DesignRequest | null = null;
  proposals: DesignerProposal[] = [];
  submittedDesigns: Design[] = [];
  loading = true;
  showProposalDialog = false;
  selectedProposal: DesignerProposal | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private designRequestService: DesignRequestService,
    private proposalService: DesignerProposalService,
    private designService: DesignService,
    private messageService: MessageService
  ) { }

  // ... (existing ngOnInit/loadRequestDetails)

  loadSubmittedDesigns(propertyId: number): void {
    this.designService.getDesignsByProperty(propertyId).subscribe({
      next: (designs) => {
        // Filter designs that might belong to accepted proposals for THIS request, if possible.
        // For now, simpler: show all designs for this property.
        this.submittedDesigns = designs;
      },
      error: (err) => {
        console.error('Error loading designs:', err);
      }
    });
  }

  ngOnInit(): void {
    this.route.params.pipe(
      map(params => +params['id']),
      switchMap(id => {
        this.requestId = id;
        this.loading = true;

        return forkJoin({
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
        });
      })
    ).subscribe({
      next: ({ request, proposals }) => {
        if (!request) {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load request.' });
          this.loading = false;
          return;
        }

        this.designRequest = request;

        // Logic to fix backend state sync issue:
        // If Request is InProgress/Active but Proposal is Pending, mark Proposal as Accepted
        // to prevent users from trying to Accept/Reject and getting errors.
        if (['InProgress', 'Active', 'Completed'].includes(request.status)) {
          this.proposals = proposals.map(p => {
            if (p.status === 'Pending' || p.status === '0') {
              return { ...p, status: 'Accepted' };
            }
            return p;
          });
        } else {
          this.proposals = proposals;
        }

        if (request.propertyID) {
          this.loadSubmittedDesigns(request.propertyID);
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Error in init:', err);
        this.loading = false;
      }
    });
  }

  loadRequestDetails(): void {
    this.loading = true;
    this.designRequestService.getDesignRequestById(this.requestId).subscribe({
      next: (request) => {
        this.designRequest = request;
        if (request.propertyID) {
          this.loadSubmittedDesigns(request.propertyID);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading design request:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load design request details.'
        });
        this.loading = false;
      }
    });
  }

  // mapStatus is now handled by the service


  loadProposals(): void {
    this.proposalService.getProposalsForRequest(this.requestId).subscribe({
      next: (proposals) => {
        this.proposals = proposals;
      },
      error: (err) => {
        console.error('Error loading proposals:', err);
      }
    });
  }

  getStatusSeverity(status: string): string {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'info';
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'completed':
        return 'success';
      default:
        return 'secondary';
    }
  }

  viewProposalDetails(proposal: DesignerProposal): void {
    this.selectedProposal = proposal;
    this.showProposalDialog = true;
  }

  chooseProposal(proposalId: number): void {
    this.proposalService.chooseProposal(proposalId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Proposal accepted successfully!'
        });
        this.loadRequestDetails();
        this.loadProposals();
        this.showProposalDialog = false;
      },
      error: (err) => {
        console.error('Error choosing proposal:', err);

        let errorMessage = 'Failed to accept proposal.';
        if (err.error) {
          if (typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (err.error.errors) {
            const validationErrors = Object.values(err.error.errors).flat().join('\n');
            errorMessage = validationErrors || 'Validation failed';
          } else if (err.error.message) {
            errorMessage = err.error.message;
          } else if (err.error.title) {
            errorMessage = err.error.title;
          }
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000
        });
      }
    });
  }

  rejectProposal(proposalId: number): void {
    this.proposalService.rejectProposal(proposalId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Success',
          detail: 'Proposal rejected.'
        });
        this.loadRequestDetails();
        this.loadProposals();
        this.showProposalDialog = false;
      },
      error: (err) => {
        console.error('Error rejecting proposal:', err);
        let errorMessage = 'Failed to reject proposal.';
        if (err.error) {
          if (typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (err.error.errors) {
            const validationErrors = Object.values(err.error.errors).flat().join('\n');
            errorMessage = validationErrors || 'Validation failed';
          } else if (err.error.message) {
            errorMessage = err.error.message;
          } else if (err.error.title) {
            errorMessage = err.error.title;
          }
        }
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage
        });
      }
    });
  }

  closeDialog(): void {
    this.showProposalDialog = false;
    this.selectedProposal = null;
  }
}

