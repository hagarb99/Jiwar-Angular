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

@Injectable({ providedIn: 'root' })
export class ProfileService extends ApiBaseService {
    private readonly apiUrl = `${this.apiBaseUrl}/account`;

    constructor(httpClient: HttpClient) {
        super(httpClient);
    }

    getProfile(): Observable<any> {
        // Calling the account service endpoint or the relevant endpoint for profile data
        return this.httpClient.get<any>(`${this.apiUrl}/profile`);
    }

    editProfile(request: EditProfileRequest): Observable<any> {
        // Clean request but keep arrays even if empty
        const cleanRequest: any = {};
        
        Object.keys(request).forEach(key => {
            const value = (request as any)[key];
            // Keep arrays even if empty, but remove undefined/null/empty strings for other fields
            if (Array.isArray(value)) {
                cleanRequest[key] = value; // Always include arrays
            } else if (value !== undefined && value !== null && value !== '') {
                cleanRequest[key] = value;
            }
        });
        
        console.log('Sending profile update request:', cleanRequest);
        return this.httpClient.put(`${this.apiUrl}/edit-profile`, cleanRequest);
    }

    completeProfile(request: CompleteProfileInteriorDesigner): Observable<any> {
        return this.httpClient.post(`${this.apiUrl}/complete-profile/property-owner`, request);
    }
}

export interface CompleteProfileInteriorDesigner {
    specializations: string[];
    certifications: string[];
    title: string;
    location: string;
    bio: string;
}
