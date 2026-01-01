import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DesignRequestService } from '../../../../../core/services/design-request.service';
import { DesignerProposalService } from '../../../../../core/services/designer-proposal.service';
import { DesignRequest } from '../../../../../core/interfaces/design-request.interface';
import { DesignerProposal } from '../../../../../core/interfaces/designer-proposal.interface';
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
  loading = true;
  showProposalDialog = false;
  selectedProposal: DesignerProposal | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private designRequestService: DesignRequestService,
    private proposalService: DesignerProposalService,
    private messageService: MessageService
  ) {}

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
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Failed to accept proposal.'
        });
      }
    });
  }

  closeDialog(): void {
    this.showProposalDialog = false;
    this.selectedProposal = null;
  }
}

