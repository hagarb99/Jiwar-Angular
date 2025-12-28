import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiBaseService } from './api-base.service';
import { Observable } from 'rxjs';
import { DesignRequest } from '../interfaces/design-request.interface';

@Injectable({
    providedIn: 'root'
})
export class DesignRequestService extends ApiBaseService {

    constructor(httpClient: HttpClient) {
        super(httpClient);
    }

    /** Create Design Request (Customer / Owner) */
    createDesignRequest(data: DesignRequest): Observable<DesignRequest> {
        return this.httpClient.post<DesignRequest>(
            `${this.apiBaseUrl}/DesignRequest/create`,
            data
        );
    }

    /** My Requests */
    getMyDesignRequests(): Observable<DesignRequest[]> {
        return this.httpClient.get<DesignRequest[]>(
            `${this.apiBaseUrl}/DesignRequest/my`
        );
    }

    /** Available Requests (Interior Designer Dashboard) */
    getAvailableDesignRequests(): Observable<DesignRequest[]> {
        return this.httpClient.get<DesignRequest[]>(
            `${this.apiBaseUrl}/DesignRequest/available`
        );
    }

    /** Get By Id */
    getDesignRequestById(id: number): Observable<DesignRequest> {
        return this.httpClient.get<DesignRequest>(
            `${this.apiBaseUrl}/DesignRequest/${id}`
        );
    }
}
