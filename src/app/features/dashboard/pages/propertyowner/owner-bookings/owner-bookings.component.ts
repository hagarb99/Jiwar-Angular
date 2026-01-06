import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { BookingService, Booking, BookingStatus} from '../../../../../core/services/booking.service';
@Component({
  selector: 'app-owner-bookings',
standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './owner-bookings.component.html',
  styleUrl: './owner-bookings.component.css'
})
export class OwnerBookingsComponent implements OnInit {
  bookings: Booking[] = [];
  loading = false;

  constructor(private bookingService: BookingService) {}

  ngOnInit() { 
    this.loadBookings();
  }

  loadBookings() {
    this.loading = true;
    this.bookingService.getOwnerBookings().subscribe({
      next: (data) => { this.bookings = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  acceptBooking(booking: Booking) {
    this.bookingService
      .updateBookingStatus(booking.id, BookingStatus.Confirmed)
      .subscribe(() => booking.status = 'Confirmed');
  }

  rejectBooking(booking: Booking) {
    this.bookingService
      .updateBookingStatus(booking.id, BookingStatus.Confirmed)
      .subscribe(() => booking.status = 'Cancelled');
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
