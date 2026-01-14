import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiBaseService } from "./api-base.service";

export interface PropertyOwnerPublicProfile {
  userId: string;
  name: string;
  profilePictureUrl?: string; // Some backends use this
  profilePicURL?: string;     // Some backends use this
  phoneNumber?: string;
  bio?: string;
  title?: string;
  location?: string;
  email?: string;
}

@Injectable({ providedIn: 'root' })
export class PropertyOwnerService extends ApiBaseService {

  // getPublicProfile(userId: string): Observable<PropertyOwnerPublicProfile> {
  //   return this.httpClient.get<PropertyOwnerPublicProfile>(
  //     `${this.apiBaseUrl}/property-owner/${userId}/public-profile`
  //   );
  // }
  // جلب بيانات المالك وعقاراته من الباك إند مباشرة
  getPublicProfile(ownerId: string): Observable<any> {
    return this.httpClient.get(`${this.apiBaseUrl}/properties/owner/${ownerId}`);
  }
}
