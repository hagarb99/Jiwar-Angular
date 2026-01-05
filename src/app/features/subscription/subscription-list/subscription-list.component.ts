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

    plans: SubscriptionPlan[] = [];
    loading = true;
    processingId: number | null = null;

    // Payment Modal
    showPaymentModal = false;
    paymobUrl = '';

    ngOnInit(): void {
        this.loadPlans();
    }

    loadPlans(): void {
        this.loading = true;
        this.subscriptionService.getSubscriptions().subscribe({
            next: (data) => {
                this.plans = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error fetching plans', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Connection Error',
                    detail: 'Failed to load subscription plans.'
                });
                this.loading = false;
            }
        });
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

        // Create DTO for backend
        const dto: CreateSubscriptionRequest = {
            name: plan.name,
            price: plan.price,
            durationInMonths: plan.durationInMonths,
            planType: plan.planType || 'Basic'
        };

        this.paymentService.createSubscriptionPayment(plan.id).subscribe({
            next: (res) => {
                this.paymobUrl = res.iframeUrl;
                this.showPaymentModal = true;
                this.processingId = null;
            },
            error: (err) => {
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
        this.loadPlans(); // Refresh subscription plans after payment
    }
}
