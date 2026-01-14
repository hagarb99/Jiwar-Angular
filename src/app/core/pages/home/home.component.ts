import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PropertyCardComponent } from '../../../shared/components/property-card/property-card.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { PricingCardComponent } from '../../../shared/components/pricing-card/pricing-card.component';
import { ButtonModule } from 'primeng/button';
import { LucideAngularModule, ArrowRight, Star, Shield, Search, BarChart3, Brain, GitCompare, TrendingUp, CheckCircle, Palette, Wand2 } from 'lucide-angular';
import { NavbarComponent } from "../../../shared/components/navbar/navbar.component";
import { SubscriptionPlan } from '../../../core/models/subscription.model';
import { Property, PropertyService, PropertyType } from '../../../core/services/property.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PropertyCardComponent,
    FooterComponent,
    PricingCardComponent,
    ButtonModule,
    LucideAngularModule,
    NavbarComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private router = inject(Router);
  private propertyService = inject(PropertyService);

  readonly ArrowRight = ArrowRight;
  readonly Star = Star;
  readonly Brain = Brain;
  readonly GitCompare = GitCompare;
  readonly TrendingUp = TrendingUp;
  readonly CheckCircle = CheckCircle;
  readonly Palette = Palette;
  readonly Wand2 = Wand2;

  heroBackgroundImage = 'Bg.jpg';

  // Dynamic Properties Data
  properties: Property[] = [];
  loading = true;

  ngOnInit() {
    this.loadProperties();
  }

  loadProperties() {
    this.loading = true;
    this.propertyService.getFilteredProperties({}).subscribe({
      next: (data: Property[]) => {
        // Map and fix URLs, take top 4
        this.properties = data.slice(0, 4).map(p => ({
          ...p,
          thumbnailUrl: p.thumbnailUrl ? this.fixUrl(p.thumbnailUrl) : undefined,
          mediaUrls: p.mediaUrls ? p.mediaUrls.map(u => this.fixUrl(u)) : []
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load properties', err);
        this.loading = false;
      }
    });
  }

  private fixUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const apiBase = environment.apiBaseUrl.replace(/\/api$/, '');
    const cleanPath = url.startsWith('/') ? url.substring(1) : url;
    return `${apiBase}/${cleanPath}`;
  }

  getPropertyTypeName(type?: PropertyType): string {
    switch (type) {
      case PropertyType.Apartment: return 'Apartment';
      case PropertyType.Villa: return 'Villa';
      case PropertyType.House: return 'House';
      case PropertyType.Studio: return 'Studio';
      default: return 'Property';
    }
  }

  // Updated Features ("Why Choose Us")
  features = [
    {
      icon: Brain,
      title: 'AI Valuation',
      description: 'Get instant, accurate property valuations powered by advanced AI algorithms.'
    },
    {
      icon: GitCompare,
      title: 'Smart Comparisons',
      description: 'Compare properties side-by-side with intelligent market insights.'
    },
    {
      icon: TrendingUp,
      title: 'Investment Tools',
      description: 'Track your portfolio and maximize returns with data-driven analytics.'
    }
  ];

  testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Property Investor',
      rating: 5,
      content: 'Smart Real Estate helped me find undervalued properties and make informed investment decisions. The AI valuation is incredibly accurate!'
    },
    {
      name: 'Michael Chen',
      role: 'First-time Buyer',
      rating: 5,
      content: 'The comparison tool made it so easy to evaluate different properties. I felt confident in my purchase decision thanks to the transparent data.'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Real Estate Agent',
      rating: 5,
      content: 'This platform has transformed how I work with clients. The analytics and portfolio management features are game-changers.'
    }
  ];

  // Subscription Plans
  plans: SubscriptionPlan[] = [
    { id: 1, name: 'Basic', price: 100, durationInMonths: 1, planType: 'Basic' },
    { id: 2, name: 'Silver', price: 250, durationInMonths: 3, planType: 'Silver' },
    { id: 3, name: 'Golden ⭐', price: 500, durationInMonths: 6, planType: 'Golden' }
  ];

  getRatingArray(rating: number): number[] {
    return Array(rating).fill(0);
  }

  handleSubscribe(plan: SubscriptionPlan): void {
    // Redirect to subscription page for full flow
    this.router.navigate(['/subscriptions']);
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

