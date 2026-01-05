import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PropertyService, Property } from '../../../../../core/services/property.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { OwnerMyPropertiesComponent } from '../owner-my-properties/owner-my-properties.component';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-edit-property',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ToastModule,
    ButtonModule,
    InputTextModule,
    InputTextarea,
    InputNumberModule
  ],
  providers: [MessageService],
  templateUrl: './edit-property.component.html'
})
export class EditPropertyComponent implements OnInit {
  propertyForm!: FormGroup;
  currentProperty: Property | null = null;
  selectedFiles: File[] = [];
  previewUrls: string[] = [];
  existingImages: string[] = [];
  loading = false;
  uploading = false;

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private propertyService = inject(PropertyService);
  private messageService = inject(MessageService);

  ngOnInit(): void {
    console.log('EditPropertyComponent initialized');
    this.initForm();
    const propertyId = this.route.snapshot.params['id'];
    console.log('Property ID from route:', propertyId);
    if (propertyId) {
      this.loadProperty(+propertyId); // Ensure it's a number
    } else {
      console.error('No property ID in route');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No property ID provided'
      });
      this.router.navigate(['/dashboard/propertyowner/my-properties']);
    }
  }

  private initForm(): void {
    this.propertyForm = this.fb.group({
      title: ['', [Validators.required]],
      description: [''],
      price: [null, [Validators.required, Validators.min(0)]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      district: [''],
      area_sqm: [null, [Validators.min(0)]],
      numBedrooms: [null, [Validators.min(0)]],
      numBathrooms: [null, [Validators.min(0)]],
      tour360Url: ['']
    });
  }

  private loadProperty(id: number): void {
    this.loading = true;
    this.propertyService.getPropertyById(id).subscribe({
      next: (property) => {
        this.currentProperty = property;
        // Process image URLs to full URLs
        this.existingImages = (property.mediaUrls || []).map(url => this.getImageUrl(url));
        this.propertyForm.patchValue({
          title: property.title,
          description: property.description,
          price: property.price,
          address: property.address,
          city: property.city,
          district: property.district,
          area_sqm: property.area_sqm,
          numBedrooms: property.numBedrooms,
          numBathrooms: property.numBathrooms,
          tour360Url: property.tour360Url
        });
        this.loading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load property details'
        });
        this.loading = false;
        this.router.navigate(['/dashboard/propertyowner/my-properties']);
      }
    });
  }

  private getImageUrl(imageUrl: string): string {
    const fallbackImage = '/logo2.png';

    if (!imageUrl) {
      return fallbackImage;
    }

    // If it's already a full URL, use it
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    // Build full URL from relative path using API base URL
    const apiBase = environment.apiBaseUrl;
    const cleanBase = apiBase.endsWith('/api') ? apiBase.replace('/api', '') : apiBase;
    const cleanPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
    const finalBase = cleanBase.endsWith('/') ? cleanBase.slice(0, -1) : cleanBase;

    return `${finalBase}/${cleanPath}`;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      Array.from(input.files).forEach(file => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          this.messageService.add({
            severity: 'error',
            summary: 'Invalid File',
            detail: `${file.name} is not a valid image file.`
          });
          return;
        }

        // Validate file size (max 10MB per file)
        if (file.size > 10 * 1024 * 1024) {
          this.messageService.add({
            severity: 'error',
            summary: 'File Too Large',
            detail: `${file.name} is larger than 10MB.`
          });
          return;
        }

        this.selectedFiles.push(file);

        // Create preview URL
        const reader = new FileReader();
        reader.onload = (e) => {
          this.previewUrls.push(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeNewImage(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.previewUrls.splice(index, 1);
  }

  removeExistingImage(index: number): void {
    this.existingImages.splice(index, 1);
  }

  onImageError(event: any): void {
    event.target.src = '/logo2.png';
  }

  cancel(): void {
    this.router.navigate(['/dashboard/propertyowner/my-properties']);
  }

  save(): void {
    console.log('Save button clicked');
    console.log('Form validity:', this.propertyForm.valid);
    console.log('Form errors:', this.propertyForm.errors);
    console.log('Form values:', this.propertyForm.value);

    if (this.propertyForm.invalid) {
      console.log('Form is invalid, marking all as touched');
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please check all required fields.'
      });
      this.propertyForm.markAllAsTouched();
      return;
    }

    if (!this.currentProperty) {
      console.log('No current property loaded');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No property loaded to update.'
      });
      return;
    }

    console.log('Starting property update...');
    this.loading = true;
    const formData = this.propertyForm.value;

    console.log('Saving property with data:', formData);
    console.log('Selected files:', this.selectedFiles);

    this.propertyService.updateProperty(this.currentProperty.propertyID, formData, this.selectedFiles).subscribe({
      next: (response) => {
        console.log('Property update response:', response);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Property updated successfully!'
        });

        this.loading = false;
        this.router.navigate(['/dashboard/propertyowner/my-properties']);
      },
      error: (error) => {
        console.error('Property update error:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update property. Please try again.'
        });
        this.loading = false;
      }
    });
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.propertyForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldErrorMessage(fieldName: string): string {
    const field = this.propertyForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    if (field.errors['min']) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be positive`;
    }

    return 'Invalid value';
  }
}
