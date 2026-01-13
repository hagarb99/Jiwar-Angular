import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ProfileService, InteriorDesigner } from '../profile.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { FileUploadModule } from 'primeng/fileupload';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ToastModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    FileUploadModule
  ],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.css',
  providers: [MessageService]
})
export class EditProfileComponent implements OnInit {
  loading = true;
  saving = false;
  profile: InteriorDesigner | null = null;
  editForm!: FormGroup;
  specializations: string[] = [];
  certifications: string[] = [];
  newSpecialization = '';
  newCertification = '';
  profilePicPreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.fetchProfile();
  }

  fetchProfile(): void {
    this.loading = true;
    this.profileService.getProfile().subscribe({
      next: (profileRaw) => {
        // Handle wrapper from backend structure update
        const data = profileRaw?.interiorDesigner || profileRaw;

        // Map backend data to our interface with proper defaults
        this.profile = {
          name: data?.name || data?.Name || '',
          email: data?.email || data?.Email || '',
          phoneNumber: data?.phoneNumber || data?.PhoneNumber || '',
          profilePicURL: data?.profilePicURL || data?.ProfilePicURL || '',
          title: data?.title || data?.Title || '',
          location: data?.location || data?.Location || '',
          bio: data?.bio || data?.Bio || '',
          specializations: Array.isArray(data?.specializations) ? data.specializations : (Array.isArray(data?.Specializations) ? data.Specializations : []),
          certifications: Array.isArray(data?.certifications) ? data.certifications : (Array.isArray(data?.Certifications) ? data.Certifications : []),
          website: data?.website || data?.Website || '',
          hourlyRate: data?.hourlyRate ?? data?.HourlyRate ?? null,
          projectMinimum: data?.projectMinimum ?? data?.ProjectMinimum ?? null,
          yearsOfExperience: data?.yearsOfExperience ?? data?.YearsOfExperience ?? null,
          stats: data?.stats || []
        };
        this.specializations = [...this.profile.specializations];
        this.certifications = [...this.profile.certifications];
        this.profilePicPreview = this.profile.profilePicURL || null;
        this.initForm(this.profile);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Could not load profile. Please try again later.'
        });
        this.loading = false;
      }
    });
  }

  initForm(data: InteriorDesigner): void {
    this.editForm = this.fb.group({
      name: [data.name || '', [Validators.required]],
      title: [data.title || '', [Validators.required]],
      bio: [data.bio || '', [Validators.required, Validators.minLength(20)]],
      location: [data.location || '', [Validators.required]],
      email: [data.email || '', [Validators.required, Validators.email]],
      phoneNumber: [data.phoneNumber || '', [Validators.required]],
      website: [data.website || ''],
      hourlyRate: [data.hourlyRate || null, [Validators.min(0)]],
      projectMinimum: [data.projectMinimum || null, [Validators.min(0)]],
      yearsOfExperience: [data.yearsOfExperience || null, [Validators.min(0)]],
      profilePicURL: [data.profilePicURL || '']
    });
  }

  addSpecialization() {
    const trimmed = this.newSpecialization.trim();
    if (trimmed && !this.specializations.includes(trimmed)) {
      this.specializations.push(trimmed);
      this.newSpecialization = '';
    } else if (this.specializations.includes(trimmed)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Duplicate',
        detail: 'This specialization already exists'
      });
    }
  }

  removeSpecialization(index: number) {
    if (index >= 0 && index < this.specializations.length) {
      this.specializations.splice(index, 1);
    }
  }

  addCertification() {
    const trimmed = this.newCertification.trim();
    if (trimmed && !this.certifications.includes(trimmed)) {
      this.certifications.push(trimmed);
      this.newCertification = '';
    } else if (this.certifications.includes(trimmed)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Duplicate',
        detail: 'This certification already exists'
      });
    }
  }

  removeCertification(index: number) {
    if (index >= 0 && index < this.certifications.length) {
      this.certifications.splice(index, 1);
    }
  }

  onFileSelect(event: any) {
    const file = event.files?.[0];
    if (file) {
      // In a real app, you'd upload the file first and get the URL
      // For now, we'll just show a preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profilePicPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    // Mark all fields as touched to show validation errors
    if (this.editForm.invalid) {
      Object.keys(this.editForm.controls).forEach(key => {
        this.editForm.get(key)?.markAsTouched();
      });
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill all required fields correctly'
      });
      return;
    }

    this.saving = true;
    const formValue = this.editForm.value;

    // Prepare edit request with proper data cleaning
    const filteredSpecs = this.specializations.filter(s => s.trim() !== '');
    const filteredCerts = this.certifications.filter(c => c.trim() !== '');

    console.log('Specializations before send:', this.specializations);
    console.log('Filtered specializations:', filteredSpecs);
    console.log('Certifications before send:', this.certifications);
    console.log('Filtered certifications:', filteredCerts);
    console.log('Bio before send:', formValue.bio?.trim());

    const editRequest: any = {
      name: formValue.name?.trim() || '',
      email: formValue.email?.trim() || '',
      phoneNumber: formValue.phoneNumber?.trim() || '',
      profilePicURL: this.profilePicPreview || formValue.profilePicURL || '',
      title: formValue.title?.trim() || '',
      location: formValue.location?.trim() || '',
      bio: formValue.bio?.trim() || '',
      specializations: filteredSpecs.join(', '), // Send as comma-separated string per new backend requirement
      certifications: filteredCerts.join(', ')   // Send as comma-separated string per new backend requirement
    };

    console.log('Edit request to send:', editRequest);

    // Add optional fields only if they have values
    if (formValue.website?.trim()) {
      editRequest.website = formValue.website.trim();
    }
    if (formValue.hourlyRate !== null && formValue.hourlyRate !== undefined) {
      editRequest.hourlyRate = formValue.hourlyRate;
    }
    if (formValue.projectMinimum !== null && formValue.projectMinimum !== undefined) {
      editRequest.projectMinimum = formValue.projectMinimum;
    }
    if (formValue.yearsOfExperience !== null && formValue.yearsOfExperience !== undefined) {
      editRequest.yearsOfExperience = formValue.yearsOfExperience;
    }

    this.profileService.editProfile(editRequest).subscribe({
      next: (response) => {
        // Update auth service with new user data
        try {
          const userJson = localStorage.getItem('currentUser');
          const currentUser = userJson ? JSON.parse(userJson) : {};

          // Update with the data we just sent (immediate update)
          this.authService.setUserData({
            id: currentUser.id,
            name: editRequest.name,
            email: editRequest.email,
            profilePicURL: editRequest.profilePicURL || currentUser.profilePicURL,
            role: currentUser.role,
            isProfileCompleted: currentUser.isProfileCompleted
          });

          // Optionally fetch updated profile to ensure consistency
          this.profileService.getProfile().subscribe({
            next: (updatedProfile) => {
              if (updatedProfile) {
                this.authService.setUserData({
                  id: currentUser.id,
                  name: updatedProfile.name || editRequest.name,
                  email: updatedProfile.email || editRequest.email,
                  profilePicURL: updatedProfile.profilePicURL || editRequest.profilePicURL || currentUser.profilePicURL,
                  role: currentUser.role,
                  isProfileCompleted: currentUser.isProfileCompleted
                });
              }
            },
            error: (err) => {
              // Silent fail - we already updated with editRequest data
              console.warn('Could not fetch updated profile, using submitted data:', err);
            }
          });
        } catch (err) {
          console.error('Error updating user data:', err);
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Profile updated successfully!'
        });

        setTimeout(() => {
          this.router.navigate(['/dashboard/interiordesigner/profile']);
        }, 1500);
        this.saving = false;
      },
      error: (err) => {
        console.error('Error updating profile:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Failed to update profile. Please try again.'
        });
        this.saving = false;
      }
    });
  }
}
