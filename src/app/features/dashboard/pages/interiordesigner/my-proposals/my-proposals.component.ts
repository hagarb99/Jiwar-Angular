import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DesignerProposalService } from '../../../../../core/services/designer-proposal.service';
import { DesignerProposal } from '../../../../../core/interfaces/designer-proposal.interface';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-my-proposals',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    ToastModule,
    ProgressSpinnerModule,
    TagModule,
    TooltipModule,
    RouterModule
  ],
  providers: [MessageService],
  templateUrl: './my-proposals.component.html',
  styleUrl: './my-proposals.component.css'
})
export class MyProposalsComponent implements OnInit {
  proposals: DesignerProposal[] = [];
  loading = false;

  constructor(
    private proposalService: DesignerProposalService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadProposals();
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

  loadProposals() {
    this.loading = true;
    this.proposalService.getMyProposals().subscribe({
      next: (data: any[]) => {
        console.log('Fetched Proposals:', data);
        // Normalize backend data (PascalCase -> camelCase) if needed
        this.proposals = data.map(p => {
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
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading proposals:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load proposals'
        });
        this.loading = false;
      }
    });
  }

  getStatusSeverity(status?: string): string {
    switch (status) {
      case 'Accepted':
        return 'success';
      case 'Rejected':
        return 'danger';
      case 'Pending':
        return 'warning';
      default:
        return 'info';
    }
  }

  getStatusLabel(status?: string): string {
    return status || 'Unknown';
  }
}
