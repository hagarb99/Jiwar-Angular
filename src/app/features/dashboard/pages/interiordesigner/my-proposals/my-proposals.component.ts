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
  ) { }

  ngOnInit() {
    this.loadProposals();
  }

  // mapStatus is no longer needed here as service does it, but keeping it for tag helper if needed
  // or just removing if not strictly used outside loadProposals

  loadProposals() {
    this.loading = true;
    this.proposalService.getMyProposals().subscribe({
      next: (data) => {
        this.proposals = data;
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
