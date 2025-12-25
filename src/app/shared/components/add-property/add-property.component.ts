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
import { AuthService } from '../../../core/services/auth.service';  // Adjust path
import { HttpClient } from '@angular/common/http';

interface PropertyCreateDTO {
  title: string;
  description: string;
  price: number;
  address: string;
  city: string;
  district?: string;
  area: number;
  rooms: number;
  bathrooms: number;
  categoryId: number;
  tour360Url?: string;
  locationLat?: number;
  locationLang?: number;
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
    ToastModule
  ],

  templateUrl: './add-property.component.html',
  styleUrls: ['./add-property.component.css'],
  providers: [MessageService]
})
export class AddPropertyComponent {
  propertyForm: FormGroup;
  loading = false;
  categories = [
    { label: 'Luxury', value: 1 },
    { label: 'New Development', value: 2 },
    { label: 'Standard', value: 3 },
    { label: 'Premium', value: 4 },
    { label: 'Commercial', value: 5 }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private http: HttpClient,
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
      tour360Url: [''],
      locationLat: [''],
      locationLang: ['']
    });
  }

  onSubmit() {
    if (this.propertyForm.invalid) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill all required fields' });
      return;
    }

    if (!this.authService.isLoggedIn()) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'You must be logged in' });
      this.router.navigate(['/login']);
      return;
    }

    this.loading = true;

    const dto: PropertyCreateDTO = this.propertyForm.value;

    this.http.post('/api/property/add', dto).subscribe({
      next: (response: any) => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Property added successfully!' });
        this.router.navigate(['/properties']);  // or my-properties
        this.loading = false;
      },
      error: (err) => {
        console.error('Add property error:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Failed to add property'
        });
        this.loading = false;
      }
    });
  }
}
