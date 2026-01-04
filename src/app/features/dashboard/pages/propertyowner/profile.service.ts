// profile.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { Observable } from 'rxjs';

export interface PropertyOwnerProfile {
  name: string;
  email: string;
  phoneNumber: string;
  profilePicURL: string;
  title: string;
  location: string;
  bio: string;
  specializations: string[];
  certifications: string[];
  companyName?: string;
  taxId?: string;
  stats: { label: string; value: string | number; icon?: string }[];
}

// Base DTO for all users
export interface EditProfileBaseDto {
  name?: string;
  email?: string;
  phoneNumber?: string;
  profilePicURL?: string;
  avatarUrl?: string;
  title?: string;
  location?: string;
  bio?: string;
}

// PropertyOwner specific DTO extending base
export interface PropertyOwnerEditProfileDto extends EditProfileBaseDto {
  companyName?: string;
  taxId?: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly apiUrl = `${environment.apiBaseUrl}/account`;

  constructor(private httpClient: HttpClient) { }

  getProfile(): Observable<PropertyOwnerProfile> {
    return this.httpClient.get<PropertyOwnerProfile>(`${this.apiUrl}/profile`);
  }

  /**
   * Updates PropertyOwner profile with partial data (only edited fields)
   * @param request Partial update request containing only changed fields
   * @returns Observable of updated PropertyOwnerProfile
   */
  editPropertyOwnerProfile(request: PropertyOwnerEditProfileDto): Observable<PropertyOwnerProfile> {
    return this.httpClient.put<PropertyOwnerProfile>(`${this.apiUrl}/edit-profile`, request);
  }

  /**
   * Legacy method for specializations/certifications - kept for compatibility
   * TODO: Consider moving these to the main edit profile DTO if backend supports it
   */
  completeProfilePropertyOwner(request: CompleteProfilePropertyOwnerRequest): Observable<PropertyOwnerProfile> {
    return this.httpClient.post<PropertyOwnerProfile>(`${this.apiUrl}/complete-profile/property-owner`, request);
  }
}

export interface CompleteProfilePropertyOwnerRequest {
  specializations: string[];
  certifications: string[];
  title: string;
  location: string;
  bio: string;
}
