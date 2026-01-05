import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { environment } from '../../../../environments/environment';
import { finalize } from 'rxjs/operators';

interface ResetPasswordRequest {
  token: string;
  email: string;
  newPassword: string;
}

interface ResetPasswordResponse {
  message: string;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ToastModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    ProgressSpinnerModule
  ],
  providers: [MessageService],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm!: FormGroup;
  loading = false;
  token: string = '';
  email: string = '';
  showNewPassword = false;
  showConfirmPassword = false;

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private httpClient = inject(HttpClient);
  private messageService = inject(MessageService);

  ngOnInit(): void {
    this.initializeForm();
    this.readQueryParameters();
  }

  private initializeForm(): void {
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(form: AbstractControl) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  private readQueryParameters(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      this.email = params['email'] || '';

      if (!this.token || !this.email) {
        this.messageService.add({
          severity: 'error',
          summary: 'Invalid Reset Link',
          detail: 'The password reset link is invalid or expired.'
        });
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      }
    });
  }

  get newPasswordErrors() {
    return this.resetPasswordForm.get('newPassword')?.errors;
  }

  get confirmPasswordErrors() {
    return this.resetPasswordForm.get('confirmPassword')?.errors;
  }

  get formErrors() {
    return this.resetPasswordForm.errors;
  }

  onSubmit(): void {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill all required fields correctly.'
      });
      return;
    }

    if (!this.token || !this.email) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid Request',
        detail: 'Missing token or email parameters.'
      });
      return;
    }

    this.loading = true;
    const { newPassword } = this.resetPasswordForm.value;

    const request: ResetPasswordRequest = {
      token: this.token,
      email: this.email,
      newPassword: newPassword
    };

    this.httpClient.post<ResetPasswordResponse>(
      `${environment.apiBaseUrl}/account/reset-password`,
      request
    ).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Password Reset Successful',
          detail: response.message || 'Your password has been reset successfully.'
        });

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        console.error('Reset password error:', error);
        let errorMessage = 'Failed to reset password. Please try again.';

        if (error.status === 400) {
          errorMessage = error.error?.message || 'Invalid token or password requirements not met.';
        } else if (error.status === 404) {
          errorMessage = 'Reset link has expired or is invalid.';
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Reset Failed',
          detail: errorMessage
        });
      }
    });
  }
}
