import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, PasswordModule, ProgressSpinnerModule, MessageModule], 
  templateUrl: './login.component.html'
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  loading = false;  

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  get emailErrors() {
    return this.loginForm.get('email')?.errors;
  }

  get passwordErrors() {
    return this.loginForm.get('password')?.errors;
  }

  submit(): void {
    if (this.loginForm.invalid) return;

    this.loading = true; // start loading
    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.authService.setToken(res.token);
        this.router.navigate(['/']); // redirect after login
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Login failed';
        console.error(err);
        this.loading = false;
      }
    });
  }
}
