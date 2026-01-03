import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiBaseService } from './api-base.service';
import { Observable } from 'rxjs';
import { Design, CreateDesign } from '../interfaces/design.interface';

@Injectable({
    providedIn: 'root'
})
export class DesignService extends ApiBaseService {

    constructor(httpClient: HttpClient) {
        super(httpClient);
    }

    /** Upload Final Design */
    uploadDesign(data: CreateDesign): Observable<Design> {
        return this.httpClient.post<Design>(
            `${this.apiBaseUrl}/Designs/upload`,
            data
        );
    }

    /** Get My Designs (Designer) */
    getMyDesigns(): Observable<Design[]> {
        return this.httpClient.get<Design[]>(
            `${this.apiBaseUrl}/Designs/my`
        );
    }

    /** Get Designs By Property */
    getDesignsByProperty(propertyId: number): Observable<Design[]> {
        return this.httpClient.get<Design[]>(
            `${this.apiBaseUrl}/Designs/property/${propertyId}`
        );
    }

    /** Get Design By Id */
    getDesignById(id: number): Observable<Design> {
        return this.httpClient.get<Design>(
            `${this.apiBaseUrl}/Designs/${id}`
        );
    }
}

