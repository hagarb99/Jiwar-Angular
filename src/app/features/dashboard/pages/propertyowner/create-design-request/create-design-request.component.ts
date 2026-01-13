import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { PropertyService, Property } from '../../../../../core/services/property.service';
import { DesignRequestService } from '../../../../../core/services/design-request.service';
import { DesignerService, Designer } from '../../../../../core/services/designer.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { FileUploadModule } from 'primeng/fileupload';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RadioButtonModule } from 'primeng/radiobutton';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-design-request',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    ToastModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    DropdownModule,
    CheckboxModule,
    FileUploadModule,
    CardModule,
    ProgressSpinnerModule,
    RadioButtonModule,
    AutoCompleteModule
  ],
  providers: [MessageService],
  templateUrl: './create-design-request.component.html',
  styleUrls: ['./create-design-request.component.css']
})
export class CreateDesignRequestComponent implements OnInit {
  currentStep = 1;
  totalSteps = 3;
  loading = false;
  saving = false;

  // Step 1: Select Property
  properties: Property[] = [];
  selectedProperty: Property | null = null;

  // Step 2: Request Details
  requestForm!: FormGroup;
  referenceImageUrls: string[] = [];
  newImageUrl = '';

  // Step 3: Request Type
  requestType: 'specific' | 'browse' | 'open' = 'open';
  selectedDesigner: Designer | null = null;
  designerSearchResults: Designer[] = [];
  designerSearchQuery = '';

  // Style options
  styleOptions = [
    'Modern',
    'Contemporary',
    'Traditional',
    'Minimalist',
    'Industrial',
    'Scandinavian',
    'Bohemian',
    'Rustic',
    'Luxury',
    'Eclectic'
  ];

  constructor(
    private fb: FormBuilder,
    private propertyService: PropertyService,
    private designRequestService: DesignRequestService,
    private designerService: DesignerService,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadProperties();

    // Check if returning from browse designers page
    this.route.queryParams.subscribe(params => {
      if (params['designerId']) {
        this.requestType = 'browse';
        this.designerService.getDesignerById(params['designerId']).subscribe({
          next: (designer) => {
            this.selectedDesigner = designer;
            this.designerSearchQuery = designer.name;
          },
          error: (err) => {
            console.error('Error loading designer:', err);
          }
        });
      }

      // Also check sessionStorage
      const storedDesigner = sessionStorage.getItem('selectedDesigner');
      if (storedDesigner) {
        try {
          this.selectedDesigner = JSON.parse(storedDesigner);
          this.designerSearchQuery = this.selectedDesigner!.name;
          this.requestType = 'browse';
          sessionStorage.removeItem('selectedDesigner');
        } catch (e) {
          console.error('Error parsing stored designer:', e);
        }
      }
    });
  }

  initForm(): void {
    this.requestForm = this.fb.group({
      preferredStyle: ['', [Validators.required]],
      budget: [null, [Validators.min(0)]],
      notes: [''],
      isForSaleEnhancement: [false]
    });
  }

  loadProperties(): void {
    this.loading = true;
    this.propertyService.getMyProperties().subscribe({
      next: (properties) => {
        this.properties = properties;
        this.loading = false;
        if (properties.length === 0) {
          this.messageService.add({
            severity: 'warn',
            summary: 'No Properties',
            detail: 'You need to have at least one property to create a design request.'
          });
        }
      },
      error: (err) => {
        console.error('Error loading properties:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load properties. Please try again.'
        });
        this.loading = false;
      }
    });
  }

  // Step Navigation
  nextStep(): void {
    if (this.currentStep === 1) {
      if (!this.selectedProperty) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Property Required',
          detail: 'Please select a property before proceeding.'
        });
        return;
      }
      this.currentStep = 2;
    } else if (this.currentStep === 2) {
      if (this.requestForm.invalid) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Validation Error',
          detail: 'Please fill all required fields correctly.'
        });
        return;
      }
      this.currentStep = 3;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  // Image URL Management
  addImageUrl(): void {
    if (this.newImageUrl.trim()) {
      this.referenceImageUrls.push(this.newImageUrl.trim());
      this.newImageUrl = '';
    }
  }

  removeImageUrl(index: number): void {
    this.referenceImageUrls.splice(index, 1);
  }

  // Designer Search
  searchDesigners(): void {
    if (this.designerSearchQuery.trim().length < 2) {
      this.designerSearchResults = [];
      return;
    }

    this.designerService.searchDesignersByName(this.designerSearchQuery).subscribe({
      next: (designers) => {
        this.designerSearchResults = designers;
      },
      error: (err) => {
        console.error('Error searching designers:', err);
        this.designerSearchResults = [];
      }
    });
  }

  selectDesigner(designer: Designer): void {
    this.selectedDesigner = designer;
    this.designerSearchQuery = designer.name;
    this.designerSearchResults = [];
  }

  // Submit Request
  submitRequest(): void {
    if (this.currentStep !== 3) {
      return;
    }

    // Validate request type selection
    if (this.requestType === 'specific' && !this.selectedDesigner) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Designer Required',
        detail: 'Please select a designer or choose a different request type.'
      });
      return;
    }

    this.saving = true;
    const formValue = this.requestForm.value;

    const propertyId = this.selectedProperty!.propertyID || this.selectedProperty!.id;

    if (!propertyId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Selected property does not have a valid ID.'
      });
      this.saving = false;
      return;
    }

    const requestData: any = {
      userID: this.authService.getUserId(),
      propertyID: propertyId,
      preferredStyle: formValue.preferredStyle,
      budget: formValue.budget || undefined,
      notes: formValue.notes || undefined,
      referenceImages: this.referenceImageUrls.length > 0 ? this.referenceImageUrls : undefined,
      isForSaleEnhancement: formValue.isForSaleEnhancement || false
    };

    // Add designerID if specific designer is selected
    if (this.requestType === 'specific' && this.selectedDesigner) {
      requestData.designerID = this.selectedDesigner.id;
    }

    this.designRequestService.createDesignRequest(requestData).subscribe({
      next: (createdRequest) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Design request created successfully!'
        });

        setTimeout(() => {
          this.router.navigate(['/dashboard/propertyowner/design-requests', createdRequest.id]);
        }, 1500);
        this.saving = false;
      },
      error: (err) => {
        console.error('Error creating design request:', err);

        let errorMessage = 'Failed to create design request. Please try again.';

        if (err.error) {
          if (err.error.errors) {
            // ASP.NET Core Validation errors
            const validationErrors = Object.values(err.error.errors).flat().join('\n');
            errorMessage = validationErrors || 'One or more validation errors occurred.';
          } else if (typeof err.error === 'string') {
            errorMessage = err.error;
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
        this.saving = false;
      }
    });
  }

  // Navigate to browse designers
  navigateToBrowseDesigners(): void {
    this.router.navigate(['/dashboard/propertyowner/browse-designers'], {
      queryParams: {
        returnTo: '/dashboard/propertyowner/design-requests/create',
        step: '3'
      }
    });
  }
}

