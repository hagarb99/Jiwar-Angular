import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DesignRequestService } from '../../../../../core/services/design-request.service';
import { DesignRequest } from '../../../../../core/interfaces/design-request.interface';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ToastModule,
    CardModule,
    ButtonModule,
    TagModule,
    ProgressSpinnerModule
  ],
  providers: [MessageService],
  templateUrl: './my-requests.component.html',
  styleUrls: ['./my-requests.component.css']
})
export class MyRequestsComponent implements OnInit {
  requests: DesignRequest[] = [];
  loading = true;

  constructor(
    private designRequestService: DesignRequestService,
    private messageService: MessageService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading = true;
    this.designRequestService.getMyDesignRequests().subscribe({
      next: (requests) => {
        this.requests = requests;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading requests:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load design requests.'
        });
        this.loading = false;
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
}

