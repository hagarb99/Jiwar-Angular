import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AccountService, UserProfile } from '../../../../../core/services/account.service';
import { PropertyService, Property } from '../../../../../core/services/property.service';
import { BookingService, CustomerBooking } from '../../../../../core/services/booking.service';
import { CustomerPropertySummary, CustomerBookingSummary, DashboardStats } from '../../../../../core/models/customer-dashboard.models';

@Component({
  selector: 'app-dashboard-customer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-customer.component.html',
  styleUrl: './dashboard-customer.component.css'
})
export class DashboardCustomerComponent implements OnInit {
  private router = inject(Router);
  private accountService = inject(AccountService);
  private propertyService = inject(PropertyService);
  private bookingService = inject(BookingService);

  userProfile: UserProfile | null = null;
  properties: CustomerPropertySummary[] = [];
  bookings: CustomerBookingSummary[] = [];
  stats: DashboardStats = {
    totalProperties: 0,
    upcomingBookings: 0,
    savedProperties: 12, // Mocked for now
    activeRequests: 2     // Mocked for now
  };

  isLoading = true;
  hasError = false;

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.hasError = false;

    // Load profile
    this.accountService.getMyProfile().subscribe({
      next: (profile: UserProfile) => {
        this.userProfile = profile;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.userProfile = null;
        this.hasError = true;
      }
    });

    // Load properties
    this.propertyService.getMyProperties().subscribe({
      next: (properties: Property[]) => {
        this.properties = this.mapPropertiesToSummary(properties);
        this.stats.totalProperties = this.properties.length;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading properties:', error);
        this.properties = [];
        this.stats.totalProperties = 0;
        this.hasError = true;
        this.isLoading = false;
      }
    });

    // Load bookings
    // Load bookings
this.bookingService.getCustomerBookings().subscribe({
  next: (bookings: CustomerBooking[]) => {
    this.bookings = this.mapBookingsToSummary(bookings);
    this.stats.upcomingBookings = this.bookings.filter(b => b.status === 'upcoming').length;
  },
  error: (err: any) => {
    console.error('Error loading bookings:', err);
    this.bookings = [];
    this.stats.upcomingBookings = 0;
    this.hasError = true;
  }
});

  }

  private mapPropertiesToSummary(properties: Property[]): CustomerPropertySummary[] {
    if (!Array.isArray(properties)) {
      console.warn('Properties is not an array:', properties);
      return [];
    }

    return properties.map(property => ({
      id: property.propertyID,
      title: property.title,
      location: `${property.district}, ${property.city}`,
      status: 'active', // Default status, could be enhanced based on backend data
      type: 'purchased' // Default type, could be enhanced based on backend data
    }));
  }

  private mapBookingsToSummary(bookings: CustomerBooking[]): CustomerBookingSummary[] {
    return bookings.map(b => ({
      id: b.id,
      property: b.propertyTitle,
      date: new Date(b.bookingDate).toISOString().split('T')[0],
      time: b.bookingTime || '',
      status: this.mapBookingStatus(b.status)
    }));
  }
  
  private mapBookingStatus(status: number): 'upcoming' | 'completed' | 'canceled' {
    switch (status) {
      case 0: return 'upcoming';   // Pending
      case 1: return 'upcoming';   // Confirmed
      case 2: return 'canceled';   // Rejected
      case 3: return 'completed';  // Completed
      default: return 'upcoming';
    }
  }
  
  // private mapBookingsToSummary(bookings: CustomerBooking[]): CustomerBookingSummary[] {
  //   if (!Array.isArray(bookings)) {
  //     console.warn('Bookings is not an array:', bookings);
  //     return [];
  //   }

  //   return bookings.map(booking => ({
  //     id: booking.id,
  //     property: booking.propertyTitle,
  //     date: new Date(booking.bookingDate).toISOString().split('T')[0],
  //     time: booking.bookingTime,
  //     status: this.mapBookingStatus(booking.status)
  //   }));
  // }

  // private mapBookingStatus(status: number): 'upcoming' | 'completed' | 'canceled' {
  //   switch (status) {
  //     case 0: return 'upcoming';  // Pending
  //     case 1: return 'upcoming';  // Confirmed
  //     case 2: return 'canceled';  // Cancelled
  //     case 3: return 'completed'; // Completed
  //     default: return 'upcoming';
  //   }
  // }

  get totalProperties(): number {
    return this.stats.totalProperties;
  }

  get upcomingBookings(): number {
    return this.stats.upcomingBookings;
  }

  goToDesigners(): void {
    this.router.navigate(['/dashboard/customer/designers-marketplace']);
  }

  goToPostRequest(): void {
    this.router.navigate(['/dashboard/customer/submit-design-offer']);
  }

  goToAiAssistant(): void {
    this.router.navigate(['/dashboard/customer/ai-assistant']);
  }

  getWelcomeMessage(): string {
    if (this.userProfile?.name) {
      return `Welcome back, ${this.userProfile.name}!`;
    }
    return 'Welcome back!';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
