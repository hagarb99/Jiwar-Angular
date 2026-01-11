import { Component, inject, OnInit } from '@angular/core';
import {BookingService, CustomerBooking , BookingStatus} from '../../../../../core/services/booking.service';
import { CommonModule } from '@angular/common';
type BookingTab = 'pending' | 'approved' | 'rejected';

@Component({
  selector: 'app-my-booking',
  imports: [CommonModule],
  templateUrl: './my-booking.component.html',
  styleUrl: './my-booking.component.css'
})
export class MyBookingComponent implements OnInit{
  private bookingService = inject(BookingService); // Injection الصحيح

  customerBookings: CustomerBooking[] = [];
  isLoadingBookings = true;
BookingStatus = BookingStatus;
 activeTab: BookingTab = 'pending';

  ngOnInit(): void {
    this.loadCustomerBookings();
  }

  loadCustomerBookings(): void {
  this.isLoadingBookings = true;

  this.bookingService.getCustomerBookings().subscribe({
    next: (bookings) => {
      this.customerBookings = bookings.map(booking => ({
        ...booking,
        startDate: new Date(booking.startDate).toLocaleDateString(),
        endDate: booking.endDate
          ? new Date(booking.endDate).toLocaleDateString()
          : undefined
      }));
      this.isLoadingBookings = false;
    },
    error: () => {
      this.isLoadingBookings = false;
    }
  });
}
  setTab(tab: BookingTab): void {
    this.activeTab = tab;
  }
   get filteredBookings(): CustomerBooking[] {
    switch (this.activeTab) {
      case 'pending':
        return this.customerBookings.filter(
          booking => booking.status === BookingStatus.Pending
        );
      case 'approved':
        return this.customerBookings.filter(
          booking => booking.status === BookingStatus.Confirmed
        );
      case 'rejected':
        return this.customerBookings.filter(
          booking => booking.status === BookingStatus.Cancelled
        );
    }
  }
  
  get totalCustomerBookings(): number {
    return this.customerBookings.length; // صححت الطريقة
  }

}
