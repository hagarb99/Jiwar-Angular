import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiBaseService } from './api-base.service';

@Injectable({
    providedIn: 'root'
})
export class PaymentService extends ApiBaseService {
    constructor(
        httpClient: HttpClient,
        private authService: AuthService
    ) {
        super(httpClient);
    }

    private get baseUrl() {
        return `${this.apiBaseUrl}/payment`;
    }

    private get bookingUrl() {
        return `${this.apiBaseUrl}/Booking`;
    }

    /**
     * Initiates a subscription payment and returns the Paymob iframe URL
     * Backend: POST api/payment/subscription/{planId}
     */
    createSubscriptionPayment(planId: number): Observable<{ iframeUrl: string }> {
        return this.httpClient.post<{ iframeUrl: string }>(`${this.baseUrl}/subscription/${planId}`, {});
    }

    /**
     * Initiates a booking payment.
     * Backend: POST api/Booking/pay (expects BuyBookingDto)
     */
    createBookingPayment(bookingId: number): Observable<{ paymentUrl: string }> {
        const userId = this.authService.getUserId();
        return this.httpClient.post<{ paymentUrl: string }>(`${this.bookingUrl}/pay`, {
            userId: userId,
            bookingId: bookingId
        });
    }

    /**
     * Initiates a report payment.
     */
    createReportPayment(reportId: number): Observable<{ iframeUrl: string }> {
        return this.httpClient.post<{ iframeUrl: string }>(`${this.baseUrl}/report/${reportId}`, {});
    }
}
