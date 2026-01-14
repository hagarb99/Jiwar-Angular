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
import { environment } from '../../../../../../../environments/environment';
import { switchMap, of } from 'rxjs';

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
  selectedFile: File | null = null;

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
      next: (data) => {
        // Check if data is nested or direct
        const designerData = data.interiorDesigner || {};

        this.profile = {
          name: data?.name || '',
          email: data?.email || '',
          phoneNumber: data?.phoneNumber || '',
          profilePicURL: data?.profilePicURL || '',
          title: data?.title || 'Interior Designer',
          location: data?.location || '',
          bio: data?.bio || '',
          // Extract specific designer fields from nested object if available, otherwise root
          specializations: designerData.specializations
            ? (Array.isArray(designerData.specializations) ? designerData.specializations : [designerData.specializations])
            : (Array.isArray(data?.specializations) ? data.specializations : []),
          certifications: Array.isArray(data?.certifications) ? data.certifications : [],

          website: designerData.portfolioURL || designerData.portfolioUrl || data?.website || '',
          hourlyRate: data?.hourlyRate ?? null,
          projectMinimum: data?.projectMinimum ?? null,
          yearsOfExperience: designerData.experienceYears || designerData.yearsOfExperience || data?.yearsOfExperience || null,
          stats: data?.stats || []
        };
        this.specializations = [...this.profile.specializations];
        this.certifications = [...this.profile.certifications];

        // Handle image preview
        this.profilePicPreview = this.getProfileImageUrl(this.profile.profilePicURL);

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

  getProfileImageUrl(url: string | null): string | null {
    if (!url) return null;
    if (url.startsWith('data:image')) return url;
    if (url.startsWith('http')) return url;

    // Construct absolute URL for server images
    const base = environment.apiBaseUrl.replace(/\/api\/?$/, '');
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
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
      this.selectedFile = file;

      // Preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profilePicPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
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

    // 1. Prepare Payload (Merge existing + form data to prevent data loss)
    const formRawValue = this.editForm.getRawValue();

    const payload: any = {
      name: formRawValue.name,
      title: formRawValue.title,
      email: formRawValue.email,
      phoneNumber: formRawValue.phoneNumber,
      location: formRawValue.location,
      bio: formRawValue.bio,
      specializations: this.specializations.filter(s => s && s.trim()),
      certifications: this.certifications.filter(c => c && c.trim()),
      yearsOfExperience: formRawValue.yearsOfExperience,
      hourlyRate: formRawValue.hourlyRate,
      projectMinimum: formRawValue.projectMinimum,
      website: formRawValue.website,
      profilePicURL: formRawValue.profilePicURL
    };

    // Helper for Step 2: Call Edit Profile API
    const callEditProfile = (finalPayload: any) => {
      this.profileService.editProfile(finalPayload).subscribe({
        next: (response: any) => {
          // Sync Global State
          this.authService.updateUserFromProfile({
            name: finalPayload.name,
            email: finalPayload.email,
            phoneNumber: finalPayload.phoneNumber,
            profilePicURL: finalPayload.profilePicURL
          });

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Profile updated successfully!'
          });

          // Navigate to Profile - CORRECTED PATH
          setTimeout(() => {
            this.router.navigate(['/dashboard/designer/profile']);
          }, 1500);
          this.saving = false;
        },
        error: (err: any) => {
          console.error('Profile update error:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'Failed to update profile.'
          });
          this.saving = false;
        }
      });
    };

    // Step 1: Check for Image Upload
    if (this.selectedFile) {
      this.authService.uploadProfilePicture(this.selectedFile).subscribe({
        next: (res: any) => {
          if (res && res.profilePicURL) {
            console.log('Image uploaded successfully:', res.profilePicURL);
            payload.profilePicURL = res.profilePicURL;
          }
          callEditProfile(payload);
        },
        error: (err: any) => {
          console.error('Image upload failed:', err);
          this.messageService.add({
            severity: 'warn',
            summary: 'Image Upload Failed',
            detail: 'Proceeding with profile update (image skipped).'
          });
          // Proceed anyway to save text data
          callEditProfile(payload);
        }
      });
    } else {
      // No image selected, proceed directly
      callEditProfile(payload);
    }
  }
}
