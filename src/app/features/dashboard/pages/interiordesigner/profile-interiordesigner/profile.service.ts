// profile.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiBaseService } from '../../../../../core/services/api-base.service';
import { Observable } from 'rxjs';

export interface InteriorDesigner {
    name: string;
    email: string;
    phoneNumber: string;
    profilePicURL: string;
    title: string;
    location: string;
    bio: string;
    specializations: string[];
    certifications: string[];
    website?: string;
    hourlyRate?: number;
    projectMinimum?: number;
    yearsOfExperience?: number;
    stats: { label: string; value: string | number; icon?: string }[];
}

export interface EditProfileRequest {
    name: string;
    email?: string;
    phoneNumber?: string;
    profilePicURL?: string;
    title?: string;
    location?: string;
    bio?: string;
    specializations?: string[];
    certifications?: string[];
    hourlyRate?: number;
    projectMinimum?: number;
    website?: string;
    yearsOfExperience?: number;
}

export interface CompleteProfileInteriorDesigner {
    bio: string;
    portfolioUrl?: string;
    yearsOfExperience?: number;
    specialization?: string;
    specializations: string; // Comma-separated string for backend
    certifications: string;   // Comma-separated string for backend
    title: string;
    location: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService extends ApiBaseService {
    private readonly apiUrl = `${this.apiBaseUrl}/account`;

    constructor(httpClient: HttpClient) {
        super(httpClient);
    }

    /**
     * Get profile data. 
     * Note: Backend may return an object containing an 'interiorDesigner' property.
     */
    getProfile(): Observable<any> {
        return this.httpClient.get<any>(`${this.apiUrl}/profile`);
    }

    /**
     * Standard profile edit (PUT)
     */
    editProfile(request: EditProfileRequest): Observable<any> {
        const cleanRequest: any = {};
        Object.keys(request).forEach(key => {
            const value = (request as any)[key];
            if (Array.isArray(value)) {
                cleanRequest[key] = value;
            } else if (value !== undefined && value !== null && value !== '') {
                cleanRequest[key] = value;
            }
        });
        return this.httpClient.put(`${this.apiUrl}/edit-profile`, cleanRequest);
    }

    /**
     * Specific endpoint for completing interior designer profile (POST)
     * Requirement: specializations and certifications are comma-separated strings
     */
    completeProfile(request: CompleteProfileInteriorDesigner): Observable<any> {
        return this.httpClient.post(`${this.apiUrl}/complete-profile/interior-designer`, request);
    }
}
