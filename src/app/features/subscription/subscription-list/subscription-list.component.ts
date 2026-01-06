import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { PaymentService } from '../../../core/services/payment.service';
import { SubscriptionPlan, CreateSubscriptionRequest } from '../../../core/models/subscription.model';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PricingCardComponent } from '../../../shared/components/pricing-card/pricing-card.component';
import { PaymentModalComponent } from '../../../shared/components/payment-modal/payment-modal.component';

@Component({
    selector: 'app-subscription-list',
    standalone: true,
    imports: [CommonModule, ToastModule, PricingCardComponent, PaymentModalComponent],
    templateUrl: './subscription-list.component.html',
    styleUrls: ['./subscription-list.component.css'],
    providers: [MessageService]
})
export class SubscriptionListComponent implements OnInit {
    private subscriptionService = inject(SubscriptionService);
    private paymentService = inject(PaymentService);
    private messageService = inject(MessageService);
    private authService = inject(AuthService);
    private router = inject(Router);

    plans: SubscriptionPlan[] = [
        { id: 1, name: 'Basic', price: 100, durationInMonths: 1, planType: 'Basic' },
        { id: 2, name: 'Silver', price: 250, durationInMonths: 3, planType: 'Silver' },
        { id: 3, name: 'Golden ⭐', price: 500, durationInMonths: 6, planType: 'Golden' }
    ];
    loading = false;
    processingId: number | null = null;

    // Payment Modal
    showPaymentModal = false;
    paymobUrl = '';

    ngOnInit(): void {
        // Data is static as requested
    }

    loadPlans(): void {
        this.loading = false;
    }

    handleSubscribe(plan: SubscriptionPlan): void {
        if (!this.authService.isLoggedIn()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Authentication Required',
                detail: 'Please log in to proceed with payment.'
            });
            this.router.navigate(['/login']);
            return;
        }

        if (!plan.id) return;

        this.processingId = plan.id;

        this.paymentService.createSubscriptionPayment(plan.id).subscribe({
            next: (res: { iframeUrl: string }) => {
                this.paymobUrl = res.iframeUrl;
                this.showPaymentModal = true;
                this.processingId = null;

                this.messageService.add({
                    severity: 'success',
                    summary: 'Payment Initiated',
                    detail: 'Redirecting to secure gateway...'
                });
            },
            error: (err: any) => {
                console.error('Payment initiation error', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Payment Error',
                    detail: err.error?.message || 'Could not initiate payment session. Please try again.'
                });
                this.processingId = null;
            }
        });
    }

    onPaymentClose(): void {
        this.showPaymentModal = false;
        this.paymobUrl = '';
        this.loadPlans(); // تحديث الباقات بعد الدفع
    }
}
