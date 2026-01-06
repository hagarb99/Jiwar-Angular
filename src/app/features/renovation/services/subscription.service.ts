import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { SubscriptionPlan } from '../../../core/models/subscription.model';
import { Observable } from 'rxjs';

/*@Injectable({
    providedIn: 'root'
})
export class SubscriptionService {
    private http = inject(HttpClient);

    getSubscriptions(): Observable<SubscriptionPlan[]> {
        return this.http.get<SubscriptionPlan[]>(`${environment.apiBaseUrl}/Subscription/plans`);
    }
}*/

@Injectable({
    providedIn: 'root'
})
export class SubscriptionService {
    private http = inject(HttpClient);

    getSubscriptions(): Observable<SubscriptionPlan[]> {
        return this.http.get<SubscriptionPlan[]>(
            'https://localhost:5001/api/Subscription/plans'
        );
    }
}

