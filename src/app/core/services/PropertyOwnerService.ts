import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiBaseService } from "./api-base.service";

export interface PropertyOwnerPublicProfile {
    userId: string;
    name: string;
    profilePictureUrl?: string;
    phoneNumber?: string;
  }

@Injectable({ providedIn: 'root' })
export class PropertyOwnerService extends ApiBaseService{

  getPublicProfile(userId: string): Observable<PropertyOwnerPublicProfile> {
    return this.httpClient.get<PropertyOwnerPublicProfile>(
      `${this.apiBaseUrl}/property-owner/${userId}/public-profile`
    );
  }
}
