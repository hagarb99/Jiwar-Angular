import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
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
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm: FormGroup;
  loading = false;
  errorMessage: string | null = null;
  showPassword = false;
  showConfirmPassword = false;
  currentSlide = 0;
  private slideInterval: any;

  roles = [
    {
      id: 'PropertyOwner',
      label: 'Property Owner',
      icon: 'pi-key',
      description: 'List and manage your properties'
    },
    {
      id: 'Customer',
      label: 'Customer',
      icon: 'pi-search',
      description: 'Browse and book properties'
    },
    {
      id: 'InteriorDesigner',
      label: 'Interior Designer',
      icon: 'pi-palette',
      description: 'Design and staging services'
    }
  ];

  roleSlides = [
    {
      id: 'owner',
      image: 'auth-slider-owner.png',
      title: 'Property Owner',
      subtitle: 'List, manage, and sell your properties easily.',
      icon: 'pi-key'
    },
    {
      id: 'customer',
      image: 'auth-slider-customer.png',
      title: 'Customer',
      subtitle: 'Discover, explore, and find your perfect home.',
      icon: 'pi-search'
    },
    {
      id: 'designer',
      image: 'auth-slider-designer.png',
      title: 'Interior Designer',
      subtitle: 'Showcase your designs and connect with property owners.',
      icon: 'pi-palette'
    }
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
      phoneNumber: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    });
  }

  submit(): void {
    if (this.registerForm.invalid) return;

    this.loading = true;
    this.errorMessage = null;

    // const data: RegisterRequest = this.registerForm.value;
    const { confirmPassword, ...data } = this.registerForm.value as any;

    this.authService.register(data).subscribe({
      next: () => {
        this.router.navigate(['/login']);
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = err.error?.message || 'Registration failed';
        this.loading = false;
      }
    });
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.roleSlides.length;
  }

  prevSlide() {
    this.currentSlide = (this.currentSlide - 1 + this.roleSlides.length) % this.roleSlides.length;
  }

  ngOnInit() {
    // Auto-advance slider every 5 seconds
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  ngOnDestroy() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }
}
