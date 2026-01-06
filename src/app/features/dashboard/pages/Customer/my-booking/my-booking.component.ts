import { Component, inject, OnInit } from '@angular/core';
import {BookingService, CustomerBooking} from '../../../../../core/services/booking.service';
import { CommonModule } from '@angular/common';
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

  ngOnInit(): void {
    this.loadCustomerBookings();
  }

  loadCustomerBookings(): void {
    this.isLoadingBookings = true;
    this.bookingService.getCustomerBookings().subscribe({
      next: (bookings) => {
        this.customerBookings = bookings.map(b => ({
          ...b,
          bookingDate: new Date(b.bookingDate).toLocaleDateString()
        }));
        this.isLoadingBookings = false;
      },
      error: (err) => {
        console.error('Error loading bookings:', err);
        this.isLoadingBookings = false;
      }
    });
  }

  get totalCustomerBookings(): number {
    return this.customerBookings.length; // صححت الطريقة
  }

}
