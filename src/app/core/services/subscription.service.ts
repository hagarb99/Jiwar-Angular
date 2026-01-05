import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SubscriptionPlan, CreateSubscriptionRequest } from '../models/subscription.model';

@Injectable({
    providedIn: 'root'
})
export class SubscriptionService {
    private apiUrl = `${environment.apiBaseUrl}/Subscription`;

    constructor(private http: HttpClient) { }

    getSubscriptions(): Observable<SubscriptionPlan[]> {
        return this.http.get<SubscriptionPlan[]>(this.apiUrl);
    }

    getSubscriptionById(id: number): Observable<SubscriptionPlan> {
        return this.http.get<SubscriptionPlan>(`${this.apiUrl}/${id}`);
    }

    createSubscription(request: CreateSubscriptionRequest): Observable<any> {
        return this.http.post(this.apiUrl, request);
    }

    updateSubscription(subscription: SubscriptionPlan): Observable<any> {
        return this.http.put(this.apiUrl, subscription);
    }

    deleteSubscription(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}
