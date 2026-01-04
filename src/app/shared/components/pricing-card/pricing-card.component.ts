import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionPlan } from '../../../core/models/subscription.model';

@Component({
    selector: 'app-pricing-card',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div 
      class="plan-card group relative bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 transition-smooth hover:border-[#D4AF37]/50 hover:shadow-luxury flex flex-col h-full"
      [class.popular-card]="isPopular">
      
      <!-- Popular Badge -->
      <div *ngIf="isPopular" 
           class="absolute -top-4 left-1/2 -translate-x-1/2 gradient-gold text-[#0f172a] text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-lg">
        Most Popular
      </div>

      <div class="mb-8">
        <h3 class="text-2xl font-bold text-white mb-2">{{ plan.name }}</h3>
        <div class="flex items-baseline mb-4">
          <span class="text-4xl font-extrabold text-[#D4AF37]">{{ plan.price | currency:'EGP':'symbol':'1.0-0' }}</span>
          <span class="text-gray-400 ml-2">/ {{ plan.durationInMonths }} months</span>
        </div>
        <p class="text-gray-300 text-sm leading-relaxed">
          Unlock premium features and increase your AI chat capabilities.
        </p>
      </div>

      <ul class="space-y-4 mb-10 flex-grow">
        <li class="flex items-center text-gray-300">
          <i class="pi pi-check-circle text-[#D4AF37] mr-3"></i>
          Expert AI Consultation
        </li>
        <li class="flex items-center text-gray-300">
          <i class="pi pi-check-circle text-[#D4AF37] mr-3"></i>
          Enhanced Chat Limits
        </li>
        <li class="flex items-center text-gray-300">
          <i class="pi pi-check-circle text-[#D4AF37] mr-3"></i>
          Priority Support
        </li>
      </ul>

      <button 
        (click)="onSubscribe.emit(plan)"
        [disabled]="loading"
        class="btn-gold-pill w-full relative overflow-hidden group-hover:scale-105 transition-transform">
        <span *ngIf="!loading">Subscribe Now</span>
        <span *ngIf="loading" class="flex items-center justify-center">
          <i class="pi pi-spin pi-spinner mr-2"></i>
          Processing...
        </span>
      </button>
    </div>
  `,
    styles: [`
    .popular-card {
      border-color: rgba(212, 175, 55, 0.3) !important;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
      transform: scale(1.02);
    }
  `]
})
export class PricingCardComponent {
    @Input() plan!: SubscriptionPlan;
    @Input() loading: boolean = false;
    @Output() onSubscribe = new EventEmitter<SubscriptionPlan>();

    get isPopular(): boolean {
        return this.plan.planType === 'Golden' || this.plan.name.toLowerCase().includes('gold');
    }
}
