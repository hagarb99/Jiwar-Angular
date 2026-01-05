import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PaymentService {
    private http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiBaseUrl}/payment`;

    /**
     * Initiates a subscription payment and returns the Paymob iframe URL
     * @param planId The ID of the subscription plan
     */
    createSubscriptionPayment(planId: number): Observable<{ iframeUrl: string }> {
        // Following the pattern of CreateBookingPaymentAsync / CreateReportPaymentAsync
        return this.http.post<{ iframeUrl: string }>(`${this.baseUrl}/subscription/${planId}`, {});
    }

    // Other payment methods following the backend IPaymentService
    createBookingPayment(bookingId: number): Observable<{ iframeUrl: string }> {
        return this.http.post<{ iframeUrl: string }>(`${this.baseUrl}/booking/${bookingId}`, {});
    }

    createReportPayment(reportId: number): Observable<{ iframeUrl: string }> {
        return this.http.post<{ iframeUrl: string }>(`${this.baseUrl}/report/${reportId}`, {});
    }
}
