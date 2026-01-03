import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiBaseService } from './api-base.service';
import { AdminAnalyticsDTO } from '../models/admin-analytics.dto';

@Injectable({
    providedIn: 'root'
})
export class AdminAnalyticsService extends ApiBaseService {

    constructor(httpClient: HttpClient) {
        super(httpClient);
    }

    getAnalytics(): Observable<AdminAnalyticsDTO> {
        return this.httpClient.get<AdminAnalyticsDTO>(`${this.apiBaseUrl}/admin/analytics/admin/all`);
    }
}
