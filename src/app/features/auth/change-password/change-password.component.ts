import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-change-password',
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
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit {
  changePasswordForm: FormGroup;
  loading = false;
  errorMessage: string | null = null;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router
  ) {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {}

  passwordMatchValidator(control: AbstractControl): { [key: string]: any } | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  get currentPasswordErrors() {
    const control = this.changePasswordForm.get('currentPassword');
    return control?.errors && control.touched ? control.errors : null;
  }

  get newPasswordErrors() {
    const control = this.changePasswordForm.get('newPassword');
    return control?.errors && control.touched ? control.errors : null;
  }

  get confirmPasswordErrors() {
    const control = this.changePasswordForm.get('confirmPassword');
    return control?.errors && control.touched ? control.errors : null;
  }

  get formErrors() {
    return this.changePasswordForm.errors;
  }

  onSubmit(): void {
    if (this.changePasswordForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = null;
    const { currentPassword, newPassword } = this.changePasswordForm.value;

    this.authService.changePassword({ currentPassword, newPassword }).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: response.message || 'Password changed successfully!'
        });
        this.loading = false;

        // Optional: redirect to profile or dashboard
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 2000);
      },
      error: (error) => {
        console.error('Change password error:', error);
        let errorMessage = 'Failed to change password. Please try again.';

        if (error.status === 400) {
          errorMessage = error.error?.message || 'Invalid current password or new password requirements not met.';
        } else if (error.status === 401) {
          errorMessage = 'Session expired. Please login again.';
          this.router.navigate(['/login']);
          return;
        }

        this.errorMessage = errorMessage;
        this.loading = false;
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.changePasswordForm.controls).forEach(key => {
      const control = this.changePasswordForm.get(key);
      control?.markAsTouched();
    });
  }
}
