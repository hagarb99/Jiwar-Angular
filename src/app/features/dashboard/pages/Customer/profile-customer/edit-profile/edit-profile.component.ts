import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../../environments/environment';
import { CustomerProfile } from '../profile-customer.component';
import { AuthService } from '../../../../../../core/services/auth.service';

@Component({
    selector: 'app-edit-customer-profile',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, ToastModule],
    providers: [MessageService],
    templateUrl: './edit-profile.component.html',
    styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent implements OnInit {
    private fb = inject(FormBuilder);
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private router = inject(Router);
    private messageService = inject(MessageService);

    form!: FormGroup;
    loading = false;
    submitting = false;

    // Image Upload related properties
    selectedFile: File | null = null;
    uploadingImage = false;
    previewUrl: string | null = null;
    currentProfilePicUrl: string | null = null;

    ngOnInit(): void {
        this.initForm();
        this.loadProfile();
    }

    private initForm(): void {
        this.form = this.fb.group({
            name: ['', Validators.required],
            phoneNumber: [''],
            title: [''],
            location: [''],
            bio: [''],
            profilePicURL: ['']
        });
    }

    private loadProfile(): void {
        this.loading = true;
        this.http.get<CustomerProfile>(`${environment.apiBaseUrl}/account/profile`).subscribe({
            next: (profile) => {
                this.currentProfilePicUrl = profile.profilePicURL;
                this.form.patchValue({
                    name: profile.name,
                    phoneNumber: profile.phoneNumber,
                    title: profile.title,
                    location: profile.location,
                    bio: profile.bio,
                    profilePicURL: profile.profilePicURL
                });
                this.loading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load profile' });
                this.loading = false;
            }
        });
    }

    // --- Image Upload Logic ---

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];

            // Validate file type
            if (!file.type.startsWith('image/')) {
                this.messageService.add({ severity: 'error', summary: 'Invalid File', detail: 'Please select a valid image file.' });
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                this.messageService.add({ severity: 'error', summary: 'File Too Large', detail: 'Please select an image smaller than 5MB.' });
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

    getProfileImageUrl(): string {
        if (this.previewUrl) return this.previewUrl;

        const url = this.form.get('profilePicURL')?.value;
        if (!url) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.form.get('name')?.value || 'User'}`;

        if (url.startsWith('http')) return url;

        const base = environment.apiBaseUrl.replace(/\/api\/?$/, '');
        return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
    }


    onSubmit(): void {
        if (this.form.invalid) return;

        this.submitting = true;

        // If a file is selected, upload it first, then update profile
        if (this.selectedFile) {
            this.authService.uploadProfilePicture(this.selectedFile).subscribe({
                next: (res) => {
                    // Update form with the new URL returned from backend
                    this.form.patchValue({ profilePicURL: res.profilePicURL });
                    this.selectedFile = null;
                    this.executeProfileUpdate();
                },
                error: (err) => {
                    console.error('Image upload failed', err);
                    this.messageService.add({ severity: 'error', summary: 'Image Error', detail: 'Failed to upload image. Saving other changes...' });
                    this.executeProfileUpdate(); // Try saving text data anyway
                }
            });
        } else {
            this.executeProfileUpdate();
        }
    }

    private executeProfileUpdate(): void {
        this.http.put(`${environment.apiBaseUrl}/account/edit-profile`, this.form.value).subscribe({
            next: () => {
                // Update local auth state with the new image if it changed
                const updatedImage = this.form.get('profilePicURL')?.value;
                if (updatedImage) {
                    // We can update the auth service state directly if needed, or rely on reload
                    // For better UX, let's update if the authService exposes a way (like updateUserFromProfile)
                    // or just trust the backend.
                }

                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Profile updated successfully' });
                this.authService.updateUserFromProfile({
                    ...this.form.value,
                    // Ensure we pass the image URL so sidebar updates instantly
                    profilePicURL: updatedImage
                });

                setTimeout(() => this.router.navigate(['/dashboard/customer/profile']), 1000);
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update profile' });
                this.submitting = false;
            }
        });
    }
}
