import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DesignRequestService } from '../../../../../core/services/design-request.service';
import { DesignerProposalService } from '../../../../../core/services/designer-proposal.service';
import { DesignRequest } from '../../../../../core/interfaces/design-request.interface';
import { CreateDesignerProposal } from '../../../../../core/interfaces/designer-proposal.interface';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-available-projects',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    ToastModule,
    ProgressSpinnerModule
  ],
  providers: [MessageService],
  templateUrl: './available-projects.component.html',
  styleUrl: './available-projects.component.css'
})
export class AvailableProjectsComponent implements OnInit {
  requests: DesignRequest[] = [];
  loading = false;
  showProposalDialog = false;
  selectedRequest: DesignRequest | null = null;
  proposalForm: FormGroup;

  constructor(
    private designRequestService: DesignRequestService,
    private proposalService: DesignerProposalService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private authService: AuthService
  ) {
    this.proposalForm = this.fb.group({
      proposalDescription: ['', [Validators.required, Validators.minLength(20)]],
      estimatedCost: [null, [Validators.required, Validators.min(1)]],
      estimatedDays: [null, [Validators.required, Validators.min(1)]],
      sampleDesignURL: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    this.loadAvailableRequests();
  }

  loadAvailableRequests() {
    this.loading = true;
    this.designRequestService.getAvailableDesignRequests().subscribe({
      next: (data) => {
        this.requests = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading requests:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load available requests'
        });
        this.loading = false;
      }
    });
  }

  openProposalDialog(request: DesignRequest) {
    this.selectedRequest = request;
    this.proposalForm.reset();
    this.showProposalDialog = true;
  }

  closeProposalDialog() {
    this.showProposalDialog = false;
    this.selectedRequest = null;
    this.proposalForm.reset();
  }

  submitProposal() {
    if (this.proposalForm.invalid || !this.selectedRequest) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill all required fields correctly'
      });
      return;
    }

    const proposalData: CreateDesignerProposal = {
      requestID: this.selectedRequest.id,
      proposalDescription: this.proposalForm.value.proposalDescription,
      estimatedCost: this.proposalForm.value.estimatedCost,
      estimatedDays: this.proposalForm.value.estimatedDays,
      sampleDesignURL: this.proposalForm.value.sampleDesignURL,
      
      // Populate backend required fields
      status: 'Pending',
      designerName: this.authService.getUserName() || 'Unknown Designer',
      designerEmail: this.authService.getUserEmail() || undefined,
      offerDetails: this.proposalForm.value.proposalDescription // Reuse description for details
    };

    this.loading = true;
    this.proposalService.sendProposal(proposalData).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Proposal sent successfully!'
        });
        this.closeProposalDialog();
        this.loadAvailableRequests();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error sending proposal:', err);
        
        let errorMessage = 'Failed to send proposal';
        if (err.error) {
            if (typeof err.error === 'string') {
                errorMessage = err.error;
            } else if (err.error.errors) {
                // Handle validation errors dictionary
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
        this.loading = false;
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Open':
        return 'bg-green-100 text-green-800';
      case 'HasProposals':
        return 'bg-blue-100 text-blue-800';
      case 'InProgress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
