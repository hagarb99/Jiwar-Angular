import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DesignService } from '../../../../../core/services/design.service';
import { DesignerProposalService } from '../../../../../core/services/designer-proposal.service';
import { DesignRequestService } from '../../../../../core/services/design-request.service';
import { CreateDesign } from '../../../../../core/interfaces/design.interface';
import { DesignerProposal } from '../../../../../core/interfaces/designer-proposal.interface';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { DropdownModule } from 'primeng/dropdown';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  selector: 'app-upload-design',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    DropdownModule,
    ToastModule,
    ProgressSpinnerModule,
    CheckboxModule
  ],
  providers: [MessageService],
  templateUrl: './upload-design.component.html',
  styleUrl: './upload-design.component.css'
})
export class UploadDesignComponent implements OnInit {
  designForm: FormGroup;
  loading = false;
  acceptedProposals: DesignerProposal[] = [];
  imageURLs: string[] = [];

  styleOptions = [
    { label: 'Modern', value: 'Modern' },
    { label: 'Classic', value: 'Classic' },
    { label: 'Minimal', value: 'Minimal' },
    { label: 'Luxury', value: 'Luxury' },
    { label: 'Scandinavian', value: 'Scandinavian' },
    { label: 'Industrial', value: 'Industrial' },
    { label: 'Traditional', value: 'Traditional' }
  ];

  constructor(
    private designService: DesignService,
    private proposalService: DesignerProposalService,
    private designRequestService: DesignRequestService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private route: ActivatedRoute
  ) {
    this.designForm = this.fb.group({
      proposalID: [null, [Validators.required]],
      propertyID: [null, [Validators.required]],
      imageURLs: [[], [Validators.required, Validators.minLength(1)]],
      ai_Generated: [false],
      selectedStyle: ['', [Validators.required]],
      description: ['', [Validators.required, Validators.minLength(20)]]
    });
  }

  ngOnInit() {
    this.loadAcceptedProposals();
  }

  loadAcceptedProposals() {
    this.proposalService.getMyProposals().subscribe({
      next: (proposals) => {
        // 1. Explicitly accepted
        const explicitlyAccepted = proposals.filter(p => p.status === 'Accepted');

        // 2. Pending to check
        const pendingProposals = proposals.filter(p => p.status === 'Pending' || p.status === '0');

        if (pendingProposals.length === 0) {
          this.processAcceptedProposals(explicitlyAccepted);
          return;
        }

        // 3. Check requests
        const checkObservables = pendingProposals.map(prop =>
          this.designRequestService.getDesignRequestById(prop.designRequestID).pipe(
            map(req => {
              if (req.status === 'InProgress' || req.status === 'Active' || req.status === 'Completed') {
                prop.status = 'Accepted';
                return prop;
              }
              return null;
            }),
            catchError(() => of(null))
          )
        );

        forkJoin(checkObservables).subscribe(results => {
          const implicitlyAccepted = results.filter((p): p is DesignerProposal => p !== null);
          const allAccepted = [...explicitlyAccepted, ...implicitlyAccepted].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
          this.processAcceptedProposals(allAccepted);
        });
      },
      error: (err) => {
        console.error('Error loading proposals:', err);
        this.messageService.add({
          severity: 'warn',
          summary: 'Warning',
          detail: 'Could not load accepted proposals'
        });
      }
    });
  }

  processAcceptedProposals(proposals: DesignerProposal[]) {
    this.acceptedProposals = proposals;

    // check for query params
    this.route.queryParams.subscribe(params => {
      const preSelectedId = params['proposalId'];
      if (preSelectedId) {
        const found = this.acceptedProposals.find(p => p.id == preSelectedId);
        if (found) {
          this.designForm.patchValue({ proposalID: found.id });
          this.onProposalChange();
        }
      } else if (this.acceptedProposals.length > 0) {
        // Optional auto-select logic
      }
    });
  }

  addImageURL() {
    const urlInput = document.getElementById('imageUrlInput') as HTMLInputElement;
    if (urlInput && urlInput.value.trim()) {
      const url = urlInput.value.trim();
      if (this.isValidUrl(url)) {
        this.imageURLs.push(url);
        this.designForm.patchValue({ imageURLs: this.imageURLs });
        urlInput.value = '';
      } else {
        this.messageService.add({
          severity: 'warn',
          summary: 'Invalid URL',
          detail: 'Please enter a valid image URL'
        });
      }
    }
  }

  removeImageURL(index: number) {
    this.imageURLs.splice(index, 1);
    this.designForm.patchValue({ imageURLs: this.imageURLs });
  }

  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  onProposalChange() {
    const proposalId = this.designForm.get('proposalID')?.value;
    const selectedProposal = this.acceptedProposals.find(p => p.id === proposalId);
    if (selectedProposal) {
      // Fetch the design request to get the propertyID
      this.designRequestService.getDesignRequestById(selectedProposal.designRequestID).subscribe({
        next: (request) => {
          this.designForm.patchValue({
            propertyID: request.propertyID
          });
        },
        error: (err) => {
          console.error('Error loading design request:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load property information'
          });
        }
      });
    }
  }

  submitDesign() {
    if (this.designForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill all required fields correctly'
      });
      return;
    }

    if (this.imageURLs.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please add at least one image URL'
      });
      return;
    }

    const designData: CreateDesign = {
      propertyID: this.designForm.value.propertyID,
      proposalID: this.designForm.value.proposalID,
      imageURLs: this.imageURLs,
      ai_Generated: this.designForm.value.ai_Generated,
      selectedStyle: this.designForm.value.selectedStyle,
      description: this.designForm.value.description
    };

    this.loading = true;
    this.designService.uploadDesign(designData).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Design uploaded successfully!'
        });
        this.designForm.reset();
        this.imageURLs = [];
        this.loadAcceptedProposals();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error uploading design:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Failed to upload design'
        });
        this.loading = false;
      }
    });
  }
}

