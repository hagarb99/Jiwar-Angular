import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { DropdownModule } from 'primeng/dropdown';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../../core/services/auth.service'; 
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { StepsModule } from 'primeng/steps';
import { MenuItem } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { FileUploadModule } from 'primeng/fileupload';
import { PropertyService } from '../../../core/services/PropertyService';

interface PropertyCreateDTO {
  title: string;
  description: string;
  price: number;
  address: string;
  city: string;
  district?: string;
  area?: number;
  rooms?: number;
  bathrooms?: number;
  categoryId: number;
  tour360Url?: string;
  locationLat?: number;
  locationLang?: number;
}

export enum ListingTypeEnum {
  Rent = 'Rent',
  Sell = 'Sell'
}


@Component({
  selector: 'app-add-property',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    DropdownModule,
    ToastModule,
    NavbarComponent,
    FooterComponent,
    StepsModule,
    CardModule,
    FileUploadModule
  ],

  templateUrl: './add-property.component.html',
  styleUrls: ['./add-property.component.css'],
  providers: [MessageService]
})
export class AddPropertyComponent {
  activeStep: number = 0;
  steps: MenuItem[] = [
    { label: 'Basic Information' },
    { label: 'Location & Details' },
    { label: 'Images & Tour' },
    { label: 'Review & Submit' }
  ];

  propertyForm: FormGroup;
  loading = false;

  categories = [
    { label: 'Luxury', value: 1 },
    { label: 'New Development', value: 2 },
    { label: 'Standard', value: 3 },
    { label: 'Premium', value: 4 },
    { label: 'Commercial', value: 5 }
  ];
  listingTypes = [
  { label: 'Rent', value: ListingTypeEnum.Rent },
  { label: 'Sell', value: ListingTypeEnum.Sell }
];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private propertyService : PropertyService,
    private messageService: MessageService,
    public router: Router
  ) {
    this.propertyForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(1)]],
      address: ['', Validators.required],
      city: ['', Validators.required],
      district: [''],
      area: [null, [Validators.required, Validators.min(1)]],
      rooms: [null, Validators.min(0)],
      bathrooms: [null, Validators.min(0)],
      categoryId: [null, Validators.required],
      listingType: [ListingTypeEnum.Sell, Validators.required], 
      tour360Url: [''],
      locationLat: [''],
      locationLang: ['']
    });
  }
  next() {
    if (this.activeStep < this.steps.length - 1 && this.isStepValid(this.activeStep)) {
      this.activeStep++;
    } else if (!this.isStepValid(this.activeStep)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Incomplete',
        detail: 'Please fill all required fields in this step'
      });
    }
  }

  prev() {
    if (this.activeStep > 0) {
      this.activeStep--;
    }
  }
  isStepValid(step: number): boolean {
    switch (step) {
      case 0: // Basic Information
        return !!(
          this.propertyForm.get('title')?.valid &&
          this.propertyForm.get('description')?.valid &&
          this.propertyForm.get('price')?.valid &&
          this.propertyForm.get('categoryId')?.valid
        );
      case 1: // Location
        return !!(
          this.propertyForm.get('address')?.valid &&
          this.propertyForm.get('city')?.valid
        );
      default:
        return true;
    }
  }
  get selectedCategoryLabel(): string {
    const categoryId = this.propertyForm.get('categoryId')?.value;
    if (!categoryId) return '—';
    const category = this.categories.find(cat => cat.value === categoryId);
    return category ? category.label : '—';
  }
  uploadedFiles: File[] = []; // array للصور اللي المستخدم رفعها

 onFileSelect(event: any) {
  // حد أقصى 10 صور
  const newFiles = event.currentFiles || event.files;
  if (this.uploadedFiles.length + newFiles.length > 10) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Limit Exceeded',
      detail: 'Maximum 10 images allowed'
    });
    return;
  }
  this.uploadedFiles = [...this.uploadedFiles, ...newFiles];
}

   removeFile(file: File) {
  this.uploadedFiles = this.uploadedFiles.filter(f => f !== file);
}

getImagePreview(file: File): string {
  return URL.createObjectURL(file);
}
   onFileRemove(event: any) {
  this.uploadedFiles = this.uploadedFiles.filter(f => f !== event.file);
   }

   onSubmit() {
  if (this.activeStep !== this.steps.length - 1) return;

  if (this.propertyForm.invalid) {
    this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Please complete all required fields' });
    return;
  }

  if (!this.authService.isLoggedIn()) {
    this.messageService.add({ severity: 'error', summary: 'Authentication Required', detail: 'You must be logged in' });
    this.router.navigate(['/login']);
    return;
  }

  this.loading = true;

  const formValue = this.propertyForm.value;
  const dto: PropertyCreateDTO = {
    title: formValue.title,
    description: formValue.description,
    price: Number(formValue.price),
    address: formValue.address,
    city: formValue.city,
    district: formValue.district || undefined,
    area: formValue.area ? Number(formValue.area) : undefined,
    rooms: formValue.rooms ? Number(formValue.rooms) : undefined,
    bathrooms: formValue.bathrooms ? Number(formValue.bathrooms) : undefined,
    categoryId: Number(formValue.categoryId),
    tour360Url: formValue.tour360Url || undefined,
    locationLat: formValue.locationLat ? Number(formValue.locationLat) : undefined,
    locationLang: formValue.locationLang ? Number(formValue.locationLang) : undefined
  };

  this.propertyService.addProperty(dto, this.uploadedFiles).subscribe({
  next: () => {
    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Property added successfully!' });
    this.router.navigate(['/properties']);
    this.loading = false;
    this.uploadedFiles = [];
  },
  error: (err) => {
    console.error('Add property error:', err);
    this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to add property' });
    this.loading = false;
  }
});

}

  // onSubmit() {
  //   // تأكد إننا في آخر خطوة
  //   if (this.activeStep !== this.steps.length - 1) {
  //     return;
  //   }

  //   if (this.propertyForm.invalid) {
  //     this.messageService.add({
  //       severity: 'error',
  //       summary: 'Validation Error',
  //       detail: 'Please complete all required fields'
  //     });
  //     return;
  //   }

  //   if (!this.authService.isLoggedIn()) {
  //     this.messageService.add({
  //       severity: 'error',
  //       summary: 'Authentication Required',
  //       detail: 'You must be logged in to add a property'
  //     });
  //     this.router.navigate(['/login']);
  //     return;
  //   }

  //   this.loading = true;

  //   const formValue = this.propertyForm.value;

  //   const dto: PropertyCreateDTO = {
  //     title: formValue.title,
  //     description: formValue.description,
  //     price: Number(formValue.price),
  //     address: formValue.address,
  //     city: formValue.city,
  //     district: formValue.district || undefined,
  //     area: formValue.area ? Number(formValue.area) : undefined,
  //     rooms: formValue.rooms ? Number(formValue.rooms) : undefined,
  //     bathrooms: formValue.bathrooms ? Number(formValue.bathrooms) : undefined,
  //     categoryId: Number(formValue.categoryId),
  //     tour360Url: formValue.tour360Url || undefined,
  //     locationLat: formValue.locationLat ? Number(formValue.locationLat) : undefined,
  //     locationLang: formValue.locationLang ? Number(formValue.locationLang) : undefined
  //   };

  //   const formData = new FormData();
  // formData.append('dto', new Blob([JSON.stringify(dto)], { type: 'application/json' }));

  // this.uploadedFiles.forEach(file => {
  //   formData.append('images', file, file.name);
  // });

  //   this.http.post('/api/property/add', dto).subscribe({
  //     next: () => {
  //       this.messageService.add({
  //         severity: 'success',
  //         summary: 'Success',
  //         detail: 'Property added successfully!'
  //       });
  //       this.router.navigate(['/properties']);
  //       this.loading = false;
  //     },
  //     error: (err) => {
  //       console.error('Add property error:', err);
  //       this.messageService.add({
  //         severity: 'error',
  //         summary: 'Error',
  //         detail: err.error?.message || 'Failed to add property. Please try again.'
  //       });
  //       this.loading = false;
  //     }
  //   });
  // }

}
