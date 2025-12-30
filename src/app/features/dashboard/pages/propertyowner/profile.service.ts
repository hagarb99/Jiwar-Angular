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
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly apiUrl = `${environment.apiBaseUrl}/account`;

  constructor(private httpClient: HttpClient) { }

  getProfile(): Observable<PropertyOwnerProfile> {
    // Calling the account service endpoint or the relevant endpoint for profile data
    return this.httpClient.get<PropertyOwnerProfile>(`${this.apiUrl}/profile`);
  }

  editProfile(request: EditProfileRequest): Observable<any> {
    return this.httpClient.put(`${this.apiUrl}/edit-profile`, request);
  }

  completeProfilePropertyOwner(request: CompleteProfilePropertyOwnerRequest): Observable<any> {
    return this.httpClient.post(`${this.apiUrl}/complete-profile/property-owner`, request);
  }
}

export interface CompleteProfilePropertyOwnerRequest {
  specializations: string[];
  certifications: string[];
  title: string;
  location: string;
  bio: string;
}
