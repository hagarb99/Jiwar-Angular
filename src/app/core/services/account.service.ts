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
}
 