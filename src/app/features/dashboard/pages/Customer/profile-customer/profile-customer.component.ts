import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';
import { Observable } from 'rxjs';

export interface CustomerProfile {
    name: string;
    email: string;
    phoneNumber: string;
    profilePicURL: string;
    title?: string;
    location?: string;
    bio?: string;
    role?: string;
}

@Component({
    selector: 'app-profile-customer',
    standalone: true,
    imports: [CommonModule, RouterModule, ToastModule],
    providers: [MessageService],
    templateUrl: './profile-customer.component.html',
    styleUrls: ['./profile-customer.component.css']
})
export class ProfileCustomerComponent implements OnInit {
    private http = inject(HttpClient);
    private messageService = inject(MessageService);

    profile: CustomerProfile | null = null;
    loading = true;

    ngOnInit(): void {
        this.loadProfile();
    }

    private loadProfile(): void {
        this.loading = true;
        this.http.get<CustomerProfile>(`${environment.apiBaseUrl}/account/profile`).subscribe({
            next: (data) => {
                this.profile = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error fetching profile', err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load profile data' });
                this.loading = false;
            }
        });
    }

    getProfileImageUrl(url: string | undefined | null): string {
        if (!url) {
            return `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.profile?.name || 'Customer'}`;
        }

        if (url.startsWith('http')) return url;

        const base = environment.apiBaseUrl.replace(/\/api\/?$/, '');
        return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
    }
}
