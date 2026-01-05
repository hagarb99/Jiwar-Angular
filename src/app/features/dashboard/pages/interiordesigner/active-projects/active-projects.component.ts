import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DesignerProposalService } from '../../../../../core/services/designer-proposal.service';
import { DesignRequestService } from '../../../../../core/services/design-request.service';
import { DesignerProposal } from '../../../../../core/interfaces/designer-proposal.interface';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-active-projects',
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
  templateUrl: './active-projects.component.html',
  styleUrl: './active-projects.component.css'
})
export class ActiveProjectsComponent implements OnInit {
  activeProposals: DesignerProposal[] = [];
  loading = false;

  constructor(
    private proposalService: DesignerProposalService,
    private designRequestService: DesignRequestService,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    this.loadActiveProjects();
  }

  loadActiveProjects() {
    this.loading = true;
    this.proposalService.getMyProposals().subscribe({
      next: (proposals) => {
        // 1. Identify proposals that are explicitly accepted
        const explicitlyAccepted = proposals.filter(p => p.status === 'Accepted');

        // 2. Identify pending proposals to check against their request status
        const pendingProposals = proposals.filter(p => p.status === 'Pending' || p.status === '0');

        if (pendingProposals.length === 0) {
          this.activeProposals = explicitlyAccepted;
          this.loading = false;
          return;
        }

        // 3. For pending proposals, fetch their DesignRequest to see if actual status is InProgress/Active
        const checkObservables = pendingProposals.map(prop =>
          this.designRequestService.getDesignRequestById(prop.designRequestID).pipe(
            map(req => {
              // If the request is InProgress, we assume this proposal (or one of them) is the active one.
              // This is a heuristic fix for the backend state sync issue.
              if (req.status === 'InProgress' || req.status === 'Active' || req.status === 'Completed') {
                prop.status = 'Accepted'; // Force update status for UI
                return prop;
              }
              return null;
            }),
            catchError(() => of(null)) // Ignore errors
          )
        );

        forkJoin(checkObservables).subscribe(results => {
          const implicitlyAccepted = results.filter((p): p is DesignerProposal => p !== null);

          // Combine and deduplicate by ID just in case
          const allAccepted = [...explicitlyAccepted, ...implicitlyAccepted];
          this.activeProposals = allAccepted.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

          this.loading = false;
        });
      },
      error: (err) => {
        console.error('Error loading active projects:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load active projects'
        });
        this.loading = false;
      }
    });
  }

  getStatusSeverity(status?: string): string {
    return 'success'; // Since they are all accepted
  }

  getStatusLabel(status?: string): string {
    return status || 'Accepted';
  }
}
