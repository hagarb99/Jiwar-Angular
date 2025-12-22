import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationComponent } from '../../../shared/components/navigation/navigation.component';
import { PropertyCardComponent } from '../../../shared/components/property-card/property-card.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { ButtonModule } from 'primeng/button';
import { LucideAngularModule, ArrowRight, Star, Shield, Search, BarChart3 } from 'lucide-angular';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    NavigationComponent,
    PropertyCardComponent,
    FooterComponent,
    ButtonModule,
    LucideAngularModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  readonly ArrowRight = ArrowRight;
  readonly Star = Star;

  heroBackgroundImage = 'Bg.jpg';
  propertyImageOne = '/property1.png';
  propertyImageTwo = '/property2.png';
  propertyImageThree = '/property3.png';
  propertyImageFour = '/property4.png';


  features = [
    {
      icon: Search,
      title: 'Smart Search',
      description: 'Find properties that match your lifestyle with our AI-powered search engine.'
    },
    {
      icon: BarChart3,
      title: 'Value Analysis',
      description: 'Get accurate property valuations based on real-time market data and local insights.'
    },
    {
      icon: Shield,
      title: 'Certified Valuations',
      description: 'Trust our professional and transparent valuation process for your peace of mind.'
    }
  ];

  testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Homeowner',
      rating: 5,
      content: 'The valuation was incredibly accurate. It helped me sell my home at the perfect price point.'
    },
    {
      name: 'David Chen',
      role: 'Real Estate Investor',
      rating: 5,
      content: 'Best property intelligence tool I have used. The market comparisons are deep and insightful.'
    },
    {
      name: 'Elena Rodriguez',
      role: 'First-time Buyer',
      rating: 5,
      content: 'Made the process of finding my first home so much less stressful. Amazing interface!'
    }
  ];

  getRatingArray(rating: number): number[] {
    return Array(rating).fill(0);
  }
}
