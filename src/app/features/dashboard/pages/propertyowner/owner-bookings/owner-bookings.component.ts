import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { BookingService, Booking, BookingStatus } from '../../../../../core/services/booking.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { AuthService } from '../../../../../core/services/auth.service';

export type BookingTab = 'requests' | 'income' | 'rejected';

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
  activeTab: BookingTab = 'requests';

  public BookingStatus = BookingStatus;

  constructor(private bookingService: BookingService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadBookings();

    this.notificationService.notifications$.subscribe(() => {
      this.loadBookings();
    });
  }

  loadBookings(): void {
    this.loading = true;

    this.bookingService.getOwnerBookings().subscribe({
      next: (data) => {
        this.bookings = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }



  get pendingBookings(): Booking[] {
    return this.bookings.filter(
      booking => booking.status === BookingStatus.Pending
    );
  }


  get confirmedBookings(): Booking[] {
    return this.bookings.filter(
      booking => booking.status === BookingStatus.Confirmed
    );
  }

  get rejectedBookings(): Booking[] {
    return this.bookings.filter(
      booking => booking.status === BookingStatus.Cancelled
    );
  }

  get activeTabBookings(): Booking[] {
    if (this.activeTab === 'requests') return this.pendingBookings;
    if (this.activeTab === 'income') return this.confirmedBookings;
    return this.rejectedBookings;
  }

  setActiveTab(tab: BookingTab): void {
    this.activeTab = tab;
  }

  acceptBooking(booking: Booking) {
    this.bookingService
      .updateBookingStatus(booking.id, BookingStatus.Confirmed)
      .subscribe(() => {
        booking.status = BookingStatus.Confirmed;
      });
  }

  rejectBooking(booking: Booking) {
    this.bookingService
      .updateBookingStatus(booking.id, BookingStatus.Cancelled)
      .subscribe(() => {
        booking.status = BookingStatus.Cancelled;
      });
  }

  getStatusClass(status: BookingStatus): string {
    switch (status) {
      case BookingStatus.Confirmed:
        return 'bg-green-100 text-green-800';
      case BookingStatus.Cancelled:
        return 'bg-red-100 text-red-800';
      case BookingStatus.Pending:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
