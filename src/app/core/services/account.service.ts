import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  role: number;
  createdAt: string;
}

export interface DesignerDto {
  id: string;
  name: string;
  profilePicURL?: string;
  bio?: string;
  city?: string;
  rating?: number;
  completedProjects?: number;
}

@Injectable({ providedIn: 'root' })
export class AccountService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  getMyProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/account/profile`);
  }

  editProfile(payload: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/account/edit-profile`, payload);
  }

  updatePropertyOwnerProfile(payload: any) {
    return this.http.post(
      `${this.apiUrl}/account/complete-profile/property-owner`,
      payload
    );
  }

  getDesigners(search?: string): Observable<DesignerDto[]> {
    let params = new URLSearchParams();
    if (search) params.append('search', search);

    // Note: HttpClient accepts params object but for simplicity with existing code structure:
    const queryString = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.http.get<DesignerDto[]>(`${this.apiUrl}/Account/designers${queryString}`);
  }
}
