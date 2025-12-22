import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService, LoginResponse } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { CheckboxModule } from 'primeng/checkbox';
import { RouterModule } from '@angular/router';
import { SocialAuthService, GoogleSigninButtonModule, SocialUser } from '@abacritt/angularx-social-login';
import { SocialLoginModule } from '@abacritt/angularx-social-login';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule,
    ReactiveFormsModule,
    FormsModule, ButtonModule, InputTextModule,
    PasswordModule, ProgressSpinnerModule, MessageModule,
    CheckboxModule, RouterModule, SocialLoginModule, GoogleSigninButtonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  loading = false;
  showPassword = false;
  rememberMe = false;
  authSubscription: Subscription | undefined;

  services = [
    { icon: 'pi-home', title: 'Property Listing', subtitle: 'List & manage properties' },
    { icon: 'pi-search', title: 'Buying & Renting', subtitle: 'Find your dream home' },
    { icon: 'pi-palette', title: 'Interior Design', subtitle: 'Professional design services' },
    { icon: 'pi-cog', title: 'Property Management', subtitle: 'Complete management solutions' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private socialAuthService: SocialAuthService,
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

    this.loading = true;
    this.errorMessage = null;

    this.authService.login(this.loginForm.value).subscribe({
      next: (response: LoginResponse) => {
        console.log('Login Response:', response);
        const token = response?.token;

        if (token) {
          this.authService.setToken(token);
          this.router.navigate(['/']);
        } else {
          this.errorMessage = 'Login failed';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Login error detailed:', err);
        const msg = err.error?.message || err.message || 'Login failed';
        this.errorMessage = msg;
        this.loading = false;
      }
    });
  }



  ngOnInit(): void {
    this.authSubscription = this.socialAuthService.authState.subscribe((user: SocialUser | null) => {
      if (!user) return;
      const idToken = (user as any).idToken || (user).idToken;
      if (!idToken) {
        console.error('No idToken returned from social login', user);
        this.errorMessage = 'Google sign-in failed: no idToken';
        return;
      }

      this.authService.googleBackendLogin({ IdToken: idToken }).subscribe({
        next: (response: any) => {
          const token = response?.Data?.Token;
          if (token) {
            this.authService.setToken(token);
            this.router.navigate(['/']);
          } else {
            this.errorMessage = 'Google login failed: No token received';
            console.error('Backend response', response);
          }
        },
        error: (err) => {
          console.error('Backend google login error', err);
          this.errorMessage = err?.error?.message || 'Google login failed';
        }
      });
    });
  }


  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
  }
}
