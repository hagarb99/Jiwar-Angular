import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ToastModule,
    ButtonModule,
    InputTextModule,
    ProgressSpinnerModule
  ],
  providers: [MessageService],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm: FormGroup;
  loading = false;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {}

  get emailErrors() {
    const control = this.forgotPasswordForm.get('email');
    return control?.errors && control.touched ? control.errors : null;
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.get('email')?.markAsTouched();
      return;
    }

    this.loading = true;
    const { email } = this.forgotPasswordForm.value;

    console.log('🔍 FORGOT PASSWORD DEBUG - About to call API with email:', email);
    console.log('🔍 FORGOT PASSWORD DEBUG - API URL will be:', `${this.authService['apiBaseUrl']}/account/forgot-password`);

    this.authService.forgotPassword({ email }).subscribe({
      next: (response) => {
        console.log('✅ FORGOT PASSWORD DEBUG - API call successful');
        console.log('✅ FORGOT PASSWORD DEBUG - Response:', response);
        console.log('✅ FORGOT PASSWORD DEBUG - Response message:', response.message);

        this.submitted = true;
        this.loading = false;

        // Always show success message for security (even if email doesn't exist)
        this.messageService.add({
          severity: 'success',
          summary: 'Reset Link Sent',
          detail: response.message || 'If the email exists, a password reset link has been sent.'
        });
      },
      error: (error) => {
        console.error('❌ FORGOT PASSWORD DEBUG - API call failed');
        console.error('❌ FORGOT PASSWORD DEBUG - Error status:', error.status);
        console.error('❌ FORGOT PASSWORD DEBUG - Error body:', error.error);
        console.error('❌ FORGOT PASSWORD DEBUG - Full error:', error);

        // Still show success message for security reasons
        this.submitted = true;
        this.loading = false;

        this.messageService.add({
          severity: 'success',
          summary: 'Reset Link Sent',
          detail: 'If the email exists, a password reset link has been sent.'
        });
      }
    });
  }

  goBackToLogin(): void {
    this.router.navigate(['/login']);
  }
}
