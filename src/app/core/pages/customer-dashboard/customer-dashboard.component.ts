import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface Property {
  id: number;
  title: string;
  location: string;
  status: 'active' | 'completed';
  type: 'purchased' | 'rented';
}

interface Booking {
  id: number;
  property: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'canceled';
}

interface SavedProperty {
  id: number;
  title: string;
  price: string;
  location: string;
  image: string;
}

interface ServiceRequest {
  id: number;
  type: string;
  property: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface Payment {
  id: number;
  description: string;
  amount: string;
  date: string;
}


@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-dashboard.component.html',
  styleUrls: ['./customer-dashboard.component.css']
})
export class CustomerDashboardComponent implements OnInit {
  private router = inject(Router);
  activeBookingTab = 'upcoming';

  properties: Property[] = [
    { id: 1, title: 'Modern Apartment', location: 'New Cairo', status: 'active', type: 'purchased' },
    { id: 2, title: 'Beach Villa', location: 'North Coast', status: 'completed', type: 'rented' },
  ];

  bookings: Booking[] = [
    { id: 1, property: 'Luxury Penthouse', date: 'Dec 20, 2024', time: '10:00 AM', status: 'upcoming' },
    { id: 2, property: 'Garden Villa', date: 'Dec 18, 2024', time: '2:00 PM', status: 'completed' },
    { id: 3, property: 'City Apartment', date: 'Dec 15, 2024', time: '11:00 AM', status: 'canceled' },
  ];

  savedProperties: SavedProperty[] = [
    { id: 1, title: 'Sunset Villa', price: '$450,000', location: '6th October', image: '/placeholder.svg' },
    { id: 2, title: 'Marina Heights', price: '$320,000', location: 'Alexandria', image: '/placeholder.svg' },
    { id: 3, title: 'Palm Residence', price: '$580,000', location: 'New Cairo', image: '/placeholder.svg' },
  ];

  requests: ServiceRequest[] = [
    { id: 1, type: 'Interior Design', property: 'My Apartment', status: 'in_progress' },
    { id: 2, type: 'Property Visit', property: 'Sunset Villa', status: 'pending' },
    { id: 3, type: 'Interior Design', property: 'Beach House', status: 'completed' },
  ];

  payments: Payment[] = [
    { id: 1, description: 'Booking Deposit - Luxury Penthouse', amount: '$2,500', date: 'Dec 10, 2024' },
    { id: 2, description: 'Design Service - Living Room', amount: '$1,200', date: 'Dec 5, 2024' },
  ];

  get upcomingBookingsCount(): number {
    return this.bookings.filter(b => b.status === 'upcoming').length;
  }

  get activeRequestsCount(): number {
    return this.requests.filter(r => r.status !== 'completed').length;
  }

  constructor() { }

  ngOnInit(): void { }

  setActiveBookingTab(tab: string): void {
    this.activeBookingTab = tab;
  }

  getFilteredBookings(): Booking[] {
    return this.bookings.filter(b => b.status === this.activeBookingTab);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'completed':
        return 'badge-default';
      case 'upcoming':
        return 'badge-info';
      case 'in_progress':
        return 'badge-primary';
      case 'pending':
        return 'badge-warning';
      case 'canceled':
        return 'badge-danger';
      default:
        return '';
    }
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
