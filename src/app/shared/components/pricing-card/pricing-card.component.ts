import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionPlan } from '../../../core/models/subscription.model';

@Component({
  selector: 'app-pricing-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="plan-card group relative backdrop-blur-xl rounded-3xl p-8 border border-white/10 flex flex-col h-full transition-all duration-300"
      [class.popular-card]="isPopular">

      <!-- Popular Badge -->
      <div *ngIf="isPopular"
        class="absolute -top-4 left-1/2 -translate-x-1/2 gradient-gold
               text-black text-xs font-bold px-4 py-1 rounded-full
               uppercase tracking-wider shadow-lg">
        Most Popular
      </div>

      <!-- Header -->
      <div class="mb-8">
        <h3 class="text-2xl font-bold text-white mb-2">
          {{ plan.name }}
        </h3>

        <div class="flex items-baseline mb-4">
          <span class="text-4xl font-extrabold text-[#D4AF37]">
            {{ plan.price | currency:'EGP':'symbol':'1.0-0' }}
          </span>
          <span class="text-gray-400 ml-2">
            / {{ plan.durationInMonths }} months
          </span>
        </div>

        <p class="text-gray-300 text-sm leading-relaxed">
          Unlock premium features and increase your AI chat capabilities.
        </p>
      </div>

      <!-- Features -->
      <ul class="space-y-4 mb-10 flex-grow">
        <li *ngFor="let feat of getFeatures()" class="flex items-center text-gray-300">
          <i class="pi pi-check-circle text-[#D4AF37] mr-3"></i>
          {{ feat }}
        </li>
      </ul>

      <!-- Action -->
      <button
        (click)="onSubscribe.emit(plan)"
        [disabled]="loading"
        class="btn-gold-pill w-full transition-all duration-300"
        [class.opacity-60]="loading"
        [class.cursor-not-allowed]="loading">

        <span *ngIf="!loading">Subscribe Now</span>

        <span *ngIf="loading" class="flex items-center justify-center">
          <i class="pi pi-spin pi-spinner mr-2"></i>
          Processing...
        </span>
      </button>
    </div>
  `,
  styles: [`
    .plan-card {
      background: rgba(255, 255, 255, 0.06);
    }

    .plan-card:hover {
      transform: translateY(-10px);
      box-shadow: 0 30px 60px rgba(212, 175, 55, 0.2);
    }

    .popular-card {
      border-color: rgba(212, 175, 55, 0.5) !important;
      background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.10),
        rgba(255, 255, 255, 0.04)
      );
      transform: scale(1.03);
    }

    .gradient-gold {
      background: linear-gradient(135deg, #D4AF37, #F9E784);
    }

    .btn-gold-pill {
      padding: 0.75rem 1.25rem;
      border-radius: 999px;
      font-weight: 600;
      color: #000;
      background: linear-gradient(135deg, #D4AF37, #F9E784);
      border: none;
    }

    .btn-gold-pill:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 15px 30px rgba(212, 175, 55, 0.35);
    }
  `]
})
export class PricingCardComponent {

  @Input() plan!: SubscriptionPlan;
  @Input() loading = false;

  @Output() onSubscribe = new EventEmitter<SubscriptionPlan>();

  get isPopular(): boolean {
    return (
      this.plan?.planType?.toLowerCase() === 'golden' ||
      this.plan?.name?.toLowerCase().includes('gold')
    );
  }

  getFeatures(): string[] {
    const type = this.plan?.planType?.toLowerCase() || 'basic';
    if (type === 'golden') {
      return [
        'Unlimited AI Power',
        '20,000 AI Tokens included',
        'Expert AI Consultation',
        'All Premium Features',
        'Priority 24/7 Support'
      ];
    } else if (type === 'silver') {
      return [
        'Advanced AI Logic',
        '5,000 AI Tokens included',
        'Faster AI Responses',
        'Priority Support',
        'Architectural Insights'
      ];
    }
    return [
      'Basic AI Consultation',
      '1,000 AI Tokens included',
      'Standard Support',
      'Community Access'
    ];
  }
}
