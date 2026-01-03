import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
  ) {}

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
    this.route.params.subscribe(params => {
      this.requestId = +params['id'];
      this.loadRequestDetails();
      this.loadProposals();
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

  mapStatus(val: any): string {
      if (val === undefined || val === null) return 'Pending';
      if (typeof val === 'string') return val;
      // Assume Enum: 0=Pending, 1=Accepted, 2=Rejected
      switch (val) {
          case 0: return 'Pending';
          case 1: return 'Accepted';
          case 2: return 'Rejected';
          case 3: return 'Completed';
          default: return 'Pending';
      }
  }

  loadProposals(): void {
    this.proposalService.getProposalsForRequest(this.requestId).subscribe({
      next: (proposals: any[]) => {
        // Normalize backend data
        this.proposals = proposals.map(p => {
             const rawStatus = p.status ?? p.Status ?? p.proposalStatus ?? 0;
             return {
                id: p.id || p.Id,
                designRequestID: p.designRequestID || p.DesignRequestID || p.requestID || p.RequestID,
                proposalDescription: p.proposalDescription || p.ProposalDescription,
                estimatedCost: p.estimatedCost || p.EstimatedCost,
                estimatedDays: p.estimatedDays || p.EstimatedDays,
                sampleDesignURL: p.sampleDesignURL || p.SampleDesignURL || p.SampleDesignUrl,
                status: this.mapStatus(rawStatus), 
                designerName: p.designerName || p.DesignerName,
                designerEmail: p.designerEmail || p.DesignerEmail
            };
        });
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

