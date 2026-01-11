import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileService, PropertyOwnerProfile, PropertyOwnerEditProfileDto } from '../../profile.service';
import { finalize } from 'rxjs/operators';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../../../../core/services/auth.service';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { ChipModule } from 'primeng/chip';
import { environment } from '../../../../../../../environments/environment';
@Component({
    selector: 'app-edit-profile-propertyowner',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ToastModule,
        ButtonModule,
        InputTextModule,
        InputTextarea
    ],
    providers: [MessageService],
    templateUrl: './edit-profile.component.html',
})
export class EditProfilePropertyownerComponent implements OnInit {
    protected readonly environment = environment;
    profileForm!: FormGroup;
    loading = false;
    currentProfile: PropertyOwnerProfile | null = null;
    selectedFile: File | null = null;
    uploadingImage = false;
    previewUrl: string | null = null;

    getProfileImageUrl(): string {
        if (this.previewUrl) return this.previewUrl;

        const url = this.profileForm.get('profilePicURL')?.value;
        if (!url) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.profileForm.get('name')?.value}`;

        if (url.startsWith('http')) return url;

        const base = this.environment.apiBaseUrl.replace(/\/api\/?$/, '');
        return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
    }

    constructor(
        private fb: FormBuilder,
        private profileService: ProfileService,
        private authService: AuthService,
        private router: Router,
        private messageService: MessageService
    ) { }

    ngOnInit(): void {
        this.initForm();
        this.loadProfile();
    }

    private initForm(): void {
        this.profileForm = this.fb.group({
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phoneNumber: [''],
            bio: [''],
            profilePicURL: ['']
        });
    }

    /**
     * Handles file selection for profile picture upload
     */
    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];

            // Validate file type
            if (!file.type.startsWith('image/')) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Invalid File',
                    detail: 'Please select a valid image file.'
                });
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'File Too Large',
                    detail: 'Please select an image smaller than 5MB.'
                });
                return;
            }

            this.selectedFile = file;

            // Create preview URL
            const reader = new FileReader();
            reader.onload = (e) => {
                this.previewUrl = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    }

    /**
     * Uploads the selected profile picture to the server
     */
    uploadProfilePicture(): void {
        if (!this.selectedFile) return;

        this.uploadingImage = true;

        this.authService.uploadProfilePicture(this.selectedFile).pipe(
            finalize(() => this.uploadingImage = false)
        ).subscribe({
            next: (response: { profilePicURL: string }) => {
                // Update form with new profile picture URL
                this.profileForm.patchValue({
                    profilePicURL: response.profilePicURL
                });

                // Clear selected file and preview
                this.selectedFile = null;

                this.messageService.add({
                    severity: 'success',
                    summary: 'Upload Successful',
                    detail: 'Profile picture uploaded successfully.'
                });
            },
            error: (error: any) => {
                console.error('Profile picture upload failed:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Upload Failed',
                    detail: 'Failed to upload profile picture. Please try again.'
                });
            }
        });
    }

    loadProfile(): void {
        this.loading = true;
        this.profileService.getProfile().subscribe({
            next: (profile) => {
                this.currentProfile = profile;
                this.profileForm.patchValue({
                    name: profile.name,
                    email: profile.email,
                    phoneNumber: profile.phoneNumber,
                    bio: profile.bio,
                    profilePicURL: profile.profilePicURL
                });

                this.loading = false;
            },
            error: (err) => {
                console.error('Failed to load profile', err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load profile data' });
                this.loading = false;
            }
        });
    }

    cancel(): void {
        this.router.navigate(['/dashboard/propertyowner/profile']);
    }

    save(): void {
        if (this.profileForm.invalid) {
            this.messageService.add({ severity: 'warn', summary: 'Invalid Form', detail: 'Please check all fields' });
            return;
        }

        this.loading = true;
        const formValue = this.profileForm.value;

        // Build partial update payload - only send edited fields with valid values
        const editProfilePayload = this.buildEditProfilePayload(formValue);

        this.profileService.editPropertyOwnerProfile(editProfilePayload).pipe(
            finalize(() => this.loading = false)
        ).subscribe({
            next: (updatedProfile) => {
                // Update user state in AuthService for reactive updates across app
                this.authService.updateUserFromProfile(updatedProfile);
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Profile updated successfully' });
                this.router.navigate(['/dashboard/propertyowner/profile']);
            },
            error: (err) => {
                console.error('Failed to update profile', err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update profile' });
            }
        });
    }

    /**
     * Builds partial update payload containing only edited fields with valid values
     */
    private buildEditProfilePayload(formValue: any): PropertyOwnerEditProfileDto {
        const payload: PropertyOwnerEditProfileDto = {};
        const originalProfile = this.currentProfile;

        if (!originalProfile) return payload;

        // Helper function to check if a field has changed and has a valid value
        const hasFieldChanged = (fieldName: string, newValue: any): boolean => {
            const originalValue = (originalProfile as any)[fieldName];
            return newValue !== originalValue && newValue !== null && newValue !== undefined && newValue !== '';
        };

        // Profile fields
        if (hasFieldChanged('name', formValue.name)) payload.name = formValue.name;
        if (hasFieldChanged('email', formValue.email)) payload.email = formValue.email;
        if (hasFieldChanged('phoneNumber', formValue.phoneNumber)) payload.phoneNumber = formValue.phoneNumber;
        if (hasFieldChanged('bio', formValue.bio)) payload.bio = formValue.bio;
        if (hasFieldChanged('profilePicURL', formValue.profilePicURL)) payload.profilePicURL = formValue.profilePicURL;

        return payload;
    }

}
