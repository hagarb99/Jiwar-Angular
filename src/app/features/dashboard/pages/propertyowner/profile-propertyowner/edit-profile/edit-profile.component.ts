import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileService, PropertyOwnerProfile, EditProfileRequest, CompleteProfilePropertyOwnerRequest } from '../../profile.service';
import { switchMap } from 'rxjs/operators';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { ChipModule } from 'primeng/chip';

@Component({
    selector: 'app-edit-profile-propertyowner',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ToastModule,
        ButtonModule,
        InputTextModule,
        ChipModule
    ],
    providers: [MessageService],
    templateUrl: './edit-profile.component.html',
})
export class EditProfilePropertyownerComponent implements OnInit {
    profileForm!: FormGroup;
    loading = false;
    currentProfile: PropertyOwnerProfile | null = null;

    constructor(
        private fb: FormBuilder,
        private profileService: ProfileService,
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
            title: [''],
            location: [''],
            bio: [''],
            email: ['', [Validators.required, Validators.email]],
            phoneNumber: [''],
            specializations: this.fb.array([]),
            certifications: this.fb.array([]),
            profilePicURL: ['']
        });
    }

    get specializations(): FormArray {
        return this.profileForm.get('specializations') as FormArray;
    }

    get certifications(): FormArray {
        return this.profileForm.get('certifications') as FormArray;
    }

    addSpecialization(value: string = ''): void {
        this.specializations.push(this.fb.control(value));
    }

    removeSpecialization(index: number): void {
        this.specializations.removeAt(index);
    }

    addCertification(value: string = ''): void {
        this.certifications.push(this.fb.control(value));
    }

    removeCertification(index: number): void {
        this.certifications.removeAt(index);
    }

    loadProfile(): void {
        this.loading = true;
        this.profileService.getProfile().subscribe({
            next: (profile) => {
                this.currentProfile = profile;
                this.profileForm.patchValue({
                    name: profile.name,
                    title: profile.title,
                    location: profile.location,
                    bio: profile.bio,
                    email: profile.email,
                    phoneNumber: profile.phoneNumber,
                    profilePicURL: profile.profilePicURL
                });

                // Clear and repopulate arrays
                this.specializations.clear();
                if (profile.specializations) {
                    profile.specializations.forEach(spec => this.addSpecialization(spec));
                }

                this.certifications.clear();
                if (profile.certifications) {
                    profile.certifications.forEach(cert => this.addCertification(cert));
                }

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
        this.router.navigate(['/dashboard/property-owner/profile']);
    }

    save(): void {
        if (this.profileForm.invalid) {
            this.messageService.add({ severity: 'warn', summary: 'Invalid Form', detail: 'Please check all fields' });
            return;
        }

        this.loading = true;
        const formValue = this.profileForm.value;

        // Clean up arrays (remove empty strings)
        const specs = (formValue.specializations || []).filter((s: string) => s && s.trim() !== '');
        const certs = (formValue.certifications || []).filter((c: string) => c && c.trim() !== '');

        // 1. Prepare EditProfileRequest (Basic User Fields)
        const editProfileReq: EditProfileRequest = {
            name: formValue.name,
            email: formValue.email,
            phoneNumber: formValue.phoneNumber,
            bio: formValue.bio,
            location: formValue.location,
            profilePicURL: formValue.profilePicURL
        };

        // 2. Prepare CompleteProfilePropertyOwnerRequest (Role Specific Fields)
        const completeProfileReq: CompleteProfilePropertyOwnerRequest = {
            specializations: specs,
            certifications: certs,
            title: formValue.title,
            location: formValue.location,
            bio: formValue.bio
        };

        // Chain the calls
        this.profileService.editProfile(editProfileReq).pipe(
            switchMap(() => this.profileService.completeProfilePropertyOwner(completeProfileReq))
        ).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Profile updated successfully' });
                setTimeout(() => {
                    this.router.navigate(['/dashboard/property-owner/profile']);
                }, 1000);
            },
            error: (err) => {
                console.error('Failed to update profile', err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update profile' });
                this.loading = false;
            }
        });
    }
}
