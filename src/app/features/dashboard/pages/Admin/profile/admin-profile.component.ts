import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { AuthService, ChangePasswordRequest } from '../../../../../core/services/auth.service';
import { ProfileService, PropertyOwnerEditProfileDto } from '../../propertyowner/profile.service';
import { environment } from '../../../../../../environments/environment';
import { LucideAngularModule, User, Mail, Phone, Lock, Camera, Save, X } from 'lucide-angular';

@Component({
    selector: 'app-admin-profile',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ToastModule,
        ButtonModule,
        InputTextModule,
        PasswordModule,
        CardModule,
        DividerModule,
        LucideAngularModule
    ],
    providers: [MessageService],
    templateUrl: './admin-profile.component.html',
    styleUrls: ['./admin-profile.component.css']
})
export class AdminProfileComponent implements OnInit {
    // Icons
    UserIcon = User;
    MailIcon = Mail;
    PhoneIcon = Phone;
    LockIcon = Lock;
    CameraIcon = Camera;
    SaveIcon = Save;
    XIcon = X;

    profileForm!: FormGroup;
    passwordForm!: FormGroup;
    loading = false;
    uploadingImage = false;
    previewUrl: string | null = null;
    selectedFile: File | null = null;

    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private profileService = inject(ProfileService);
    private messageService = inject(MessageService);
    private router = inject(Router);

    ngOnInit(): void {
        this.initForms();
        this.loadAdminData();
    }

    private initForms(): void {
        this.profileForm = this.fb.group({
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phoneNumber: [''],
            profilePicURL: ['']
        });

        this.passwordForm = this.fb.group({
            currentPassword: ['', Validators.required],
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required]
        }, { validators: this.passwordMatchValidator });
    }

    private passwordMatchValidator(g: FormGroup) {
        return g.get('newPassword')?.value === g.get('confirmPassword')?.value
            ? null : { 'mismatch': true };
    }

    private loadAdminData(): void {
        this.loading = true;
        this.authService.currentUser$.subscribe(user => {
            if (user) {
                this.profileForm.patchValue({
                    name: user.name,
                    email: user.email,
                    phoneNumber: user.phoneNumber || '',
                    profilePicURL: user.profilePicURL
                });
                this.loading = false;
            }
        });
    }

    getProfileImageUrl(): string {
        if (this.previewUrl) return this.previewUrl;
        const url = this.profileForm.get('profilePicURL')?.value;
        if (!url) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.profileForm.get('name')?.value || 'Admin'}`;
        if (url.startsWith('http')) return url;
        const base = environment.apiBaseUrl.replace(/\/api\/?$/, '');
        return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            if (!file.type.startsWith('image/')) {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid file type' });
                return;
            }
            this.selectedFile = file;
            const reader = new FileReader();
            reader.onload = (e) => this.previewUrl = e.target?.result as string;
            reader.readAsDataURL(file);
        }
    }

    updateProfile(): void {
        if (this.profileForm.invalid) return;

        this.loading = true;
        if (this.selectedFile) {
            this.authService.uploadProfilePicture(this.selectedFile).subscribe({
                next: (res) => {
                    this.profileForm.patchValue({ profilePicURL: res.profilePicURL });
                    this.selectedFile = null;
                    this.saveProfileData();
                },
                error: () => {
                    this.loading = false;
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to upload image' });
                }
            });
        } else {
            this.saveProfileData();
        }
    }

    private saveProfileData(): void {
        const payload: PropertyOwnerEditProfileDto = {
            name: this.profileForm.value.name,
            email: this.profileForm.value.email,
            phoneNumber: this.profileForm.value.phoneNumber,
            profilePicURL: this.profileForm.value.profilePicURL
        };

        this.profileService.editPropertyOwnerProfile(payload).pipe(
            finalize(() => this.loading = false)
        ).subscribe({
            next: (updatedProfile) => {
                this.authService.updateUserFromProfile(updatedProfile);
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Profile updated successfully' });
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update profile' });
            }
        });
    }

    changePassword(): void {
        if (this.passwordForm.invalid) return;

        this.loading = true;
        const passwordData: ChangePasswordRequest = {
            currentPassword: this.passwordForm.value.currentPassword,
            newPassword: this.passwordForm.value.newPassword
        };

        this.authService.changePassword(passwordData).pipe(
            finalize(() => this.loading = false)
        ).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Password changed successfully' });
                this.passwordForm.reset();
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to change password' });
            }
        });
    }
}
