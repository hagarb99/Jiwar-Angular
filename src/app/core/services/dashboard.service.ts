import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiBaseService } from './api-base.service';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class DashboardService extends ApiBaseService {

    constructor(httpClient: HttpClient) {
        super(httpClient);
    }

    getDashboardData(): Observable<any> {
        return this.httpClient.get<any>(`${this.apiBaseUrl}/dashboard/designer`);
    }
}