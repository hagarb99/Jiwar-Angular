import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService, RegisterRequest } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { DropdownModule } from 'primeng/dropdown';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    ProgressSpinnerModule,
    MessageModule,
    DropdownModule,
    RouterModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  errorMessage: string | null = null;
  roles = [
    { label: 'Property Owner', value: 'PropertyOwner' },
    { label: 'Interior Designer', value: 'InteriorDesigner' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      role: [null, Validators.required],
      phoneNumber: ['', Validators.required]
    });
  }

  submit(): void {
    if (this.registerForm.invalid) return;

    this.loading = true;
    this.errorMessage = null;

    const data: RegisterRequest = this.registerForm.value;

    this.authService.register(data).subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = err.error?.message || 'Registration failed';
        this.loading = false;
      }
    });
  }
}
