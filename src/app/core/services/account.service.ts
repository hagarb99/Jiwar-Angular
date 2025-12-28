import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  getMyProfile() {
    return this.http.get(`${this.apiUrl}/account/edit-profile`);
  }

  updatePropertyOwnerProfile(payload: any) {
    return this.http.post(
      `${this.apiUrl}/account/complete-profile/property-owner`,
      payload
    );
  }
}
