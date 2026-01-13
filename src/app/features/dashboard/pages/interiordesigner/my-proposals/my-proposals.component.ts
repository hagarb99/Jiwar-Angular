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
import { DialogModule } from 'primeng/dialog';
import { Router } from '@angular/router';

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
    DialogModule,
    RouterModule
  ],
  templateUrl: './my-proposals.component.html',
  styleUrl: './my-proposals.component.css'
})
export class MyProposalsComponent implements OnInit {
  proposals: DesignerProposal[] = [];
  loading = false;

  constructor(
    private proposalService: DesignerProposalService,
    private messageService: MessageService,
    private router: Router
  ) { }

  selectedProposal: DesignerProposal | null = null;
  displayDetails = false;

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

  getStatusSeverity(status?: string | number): string {
    const s = Number(status);
    if (s === 1 || s === 3) return 'success';
    if (s === 2) return 'danger';
    if (s === 0) return 'warning';
    return 'info';
  }

  getStatusLabel(status?: string | number): string {
    const s = Number(status);
    switch (s) {
      case 0: return 'Pending';
      case 1: return 'Accepted';
      case 2: return 'Rejected';
      case 3: return 'Delivered';
      default: return 'Pending';
    }
  }

  viewDetails(proposal: DesignerProposal) {
    this.selectedProposal = proposal;
    this.displayDetails = true;
  }

  goToWorkspace(requestId: number) {
    this.router.navigate(['/dashboard/workspace', requestId]);
  }
}
