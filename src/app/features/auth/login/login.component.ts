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
         this.authService.setAuthData(response);
         this.navigateByRole(response.role);
        } else {
          this.errorMessage = 'Login failed: No token received';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Login error detailed:', err);
        if (err.status === 401) {
        this.errorMessage = err.error?.message || 'Invalid email or password';
      } else if (err.status === 400) {
        this.errorMessage = 'Invalid input. Please check your details.';
      } else {
        // Other errors (network, 500, etc.)
        this.errorMessage = 'Something went wrong. Please try again later.';
      }
        this.loading = false;
      }
    });
  }


ngOnInit(): void {
  this.authSubscription = this.socialAuthService.authState.subscribe((user: SocialUser | null) => {
    if (!user || !user.idToken) {
      return; // No login happened
    }

    // Show loading while contacting backend
    this.loading = true;
    this.errorMessage = null;

    this.authService.googleBackendLogin(user.idToken).subscribe({
      next: (response: any) => {
        // Now response has: { Success: true, Data: { Token: "...", ... } }
        const token = response?.data?.token || response?.token;

        if (token) {
          const loginResponse: LoginResponse = {
  id: response.data.id,
  name: response.data.name,
  email: response.data.email,
  profilePicURL: response.data.profilePicURL,
  role: response.data.role,
  token: response.data.token,
  isProfileCompleted: response.data.isProfileCompleted
};

this.authService.setAuthData(loginResponse);
this.navigateByRole(loginResponse.role);
} else {
          this.errorMessage = 'Google login failed: No token received';
          console.error('Invalid response:', response);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Google login error:', err);
        this.errorMessage = err?.error?.message || 'Failed to sign in with Google';
        this.loading = false;
      }
    });
  });
}

googleLogin() {
  this.socialAuthService.signIn(GoogleLoginProvider.PROVIDER_ID);
}
triggerGoogleSignIn() {
  // const button = document.querySelector('asl-google-signin-button') as HTMLElement;
  // button?.click();
this.googleLogin();

}

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
  }



  private navigateByRole(role: string) {
  switch (role) {
    case 'PropertyOwner':
      this.router.navigate(['propertyowner']);
      break;
    case 'Admin':
      this.router.navigate(['/admin/dashboard']);
      break;
    case 'Customer':
      this.router.navigate(['/customer/home']);
      break;
    case 'InteriorDesigner':
      this.router.navigate(['dashboard']);
      break;
    default:
      this.router.navigate(['/']);
      break;
  }
}


}
