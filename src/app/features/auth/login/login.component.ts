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
import { SocialAuthService, GoogleSigninButtonModule, SocialUser, GoogleLoginProvider } from '@abacritt/angularx-social-login';
import { SocialLoginModule } from '@abacritt/angularx-social-login';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    ProgressSpinnerModule,
    MessageModule,
    CheckboxModule,
    RouterModule,
    SocialLoginModule,
    GoogleSigninButtonModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LoginComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loginForm: FormGroup;
  errorMessage: string | null = null;
  loading = false;
  showPassword = false;
  rememberMe = false;

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
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Check if already logged in
    if (this.authService.isLoggedIn()) {
      const role = this.authService.userRole;
      if (role) {
        console.log('[LoginComponent] User already logged in, redirecting...');
        this.navigateByRole(role);
        return;
      }
    }

    // Listen for Google Sign-In events
    this.socialAuthService.authState
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: SocialUser | null) => {
          if (!user || !user.idToken) {
            return; // No login event
          }

          console.log('[LoginComponent] Google user detected, verifying with backend...');
          this.handleGoogleLogin(user.idToken);
        },
        error: (err) => {
          console.error('[LoginComponent] Google auth state error:', err);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================================
  // FORM GETTERS
  // ============================================================================

  get emailErrors() {
    const control = this.loginForm.get('email');
    if (!control || !control.touched) return null;

    if (control.hasError('required')) return { required: true };
    if (control.hasError('email')) return { email: true };
    return null;
  }

  get passwordErrors() {
    const control = this.loginForm.get('password');
    if (!control || !control.touched) return null;

    if (control.hasError('required')) return { required: true };
    if (control.hasError('minlength')) return { minlength: true };
    return null;
  }

  // ============================================================================
  // NORMAL LOGIN
  // ============================================================================

  submit(): void {
    // Mark all fields as touched to show validation errors
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });

    if (this.loginForm.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly.';
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    console.log('[LoginComponent] Attempting login...');

    this.authService.login(this.loginForm.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: LoginResponse) => {
          console.log('[LoginComponent] Login successful, navigating...');
          this.loading = false;
          this.navigateByRole(response.role);
        },
        error: (err: any) => {
          console.error('[LoginComponent] Login failed:', err);
          this.loading = false;

          // Extract user-friendly error message
          if (err.status === 0) {
            this.errorMessage = 'Cannot connect to server. Please check your internet connection.';
          } else if (err.status === 401) {
            this.errorMessage = 'Invalid email or password. Please try again.';
          } else if (err.status === 400) {
            this.errorMessage = err.message || 'Invalid input. Please check your details.';
          } else if (err.status >= 500) {
            this.errorMessage = 'Server error. Please try again later.';
          } else {
            this.errorMessage = err.message || 'Something went wrong. Please try again.';
          }
        }
      });
  }

  // ============================================================================
  // GOOGLE LOGIN
  // ============================================================================

  googleLogin(): void {
    console.log('[LoginComponent] Initiating Google Sign-In...');
    this.errorMessage = null;

    this.socialAuthService.signIn(GoogleLoginProvider.PROVIDER_ID)
      .catch(err => {
        console.error('[LoginComponent] Google Sign-In popup error:', err);
        this.errorMessage = 'Failed to open Google Sign-In. Please try again.';
      });
  }

  triggerGoogleSignIn(): void {
    this.googleLogin();
  }

  /**
   * Handle Google login after user selects account
   */
  private handleGoogleLogin(idToken: string): void {
    this.loading = true;
    this.errorMessage = null;

    console.log('[LoginComponent] Verifying Google token with backend...');

    this.authService.googleBackendLogin(idToken)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: LoginResponse) => {
          console.log('[LoginComponent] Google login successful, navigating...');
          this.loading = false;
          this.navigateByRole(response.role);
        },
        error: (err: any) => {
          console.error('[LoginComponent] Google login verification failed:', err);
          this.loading = false;

          if (err.status === 0) {
            this.errorMessage = 'Cannot connect to server. Please check your internet connection.';
          } else if (err.status === 401) {
            this.errorMessage = 'Google account not recognized. Please register first.';
          } else if (err.status === 400) {
            this.errorMessage = err.message || 'Invalid Google token. Please try again.';
          } else {
            this.errorMessage = err.message || 'Failed to sign in with Google. Please try again.';
          }

          // Sign out from Google to allow retry
          this.socialAuthService.signOut().catch(console.error);
        }
      });
  }

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  /**
   * Navigate user to appropriate dashboard based on role
   */
  private navigateByRole(role: string): void {
    console.log('[LoginComponent] Navigating user with role:', role);

    const routes: Record<string, string> = {
      'PropertyOwner': '/dashboard/propertyowner/dashboard',
      'InteriorDesigner': '/dashboard/designer/dashboard',
      'Admin': '/dashboard/admin',
      'Customer': '/dashboard/customer'
    };

    const targetRoute = routes[role] || '/';

    this.router.navigate([targetRoute])
      .then(success => {
        if (success) {
          console.log('[LoginComponent] Navigation successful to:', targetRoute);
        } else {
          console.warn('[LoginComponent] Navigation failed, redirecting to home');
          this.router.navigate(['/']);
        }
      })
      .catch(err => {
        console.error('[LoginComponent] Navigation error:', err);
        this.router.navigate(['/']);
      });
  }
}
