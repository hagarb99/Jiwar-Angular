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
    console.log('🔄 Loading owner bookings...');

    this.bookingService.getOwnerBookings().subscribe({
      next: (data) => {
        console.log('✅ Owner bookings loaded:', data);
        this.bookings = data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error loading owner bookings:', err);
        this.loading = false;
      }
    });
  }

  /**
   * Helper to safely check status regardless of type (number/string)
   */
  private isStatus(bookingStatus: any, targetStatus: BookingStatus): boolean {
    if (bookingStatus === undefined || bookingStatus === null) return false;

    // Direct match (number or string if backend returns "0")
    if (bookingStatus == targetStatus) return true;

    // String match (e.g. "Pending" vs BookingStatus.Pending (0))
    if (typeof bookingStatus === 'string') {
      const targetString = BookingStatus[targetStatus]; // e.g. "Pending"
      if (targetString && bookingStatus.toLowerCase() === targetString.toLowerCase()) {
        return true;
      }
    }

    return false;
  }

  get pendingBookings(): Booking[] {
    return this.bookings.filter(
      booking => this.isStatus(booking.status, BookingStatus.Pending)
    );
  }


  get confirmedBookings(): Booking[] {
    return this.bookings.filter(
      booking => this.isStatus(booking.status, BookingStatus.Confirmed)
    );
  }

  get rejectedBookings(): Booking[] {
    return this.bookings.filter(
      booking => this.isStatus(booking.status, BookingStatus.Cancelled)
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
      .subscribe({
        next: () => {
          // Optimistic update
          booking.status = BookingStatus.Confirmed;
          this.loadBookings(); // Reload to be sure and update lists
        },
        error: (err) => console.error('Error accepting booking', err)
      });
  }

  rejectBooking(booking: Booking) {
    this.bookingService
      .updateBookingStatus(booking.id, BookingStatus.Cancelled)
      .subscribe({
        next: () => {
          booking.status = BookingStatus.Cancelled;
          this.loadBookings();
        },
        error: (err) => console.error('Error rejecting booking', err)
      });
  }

  getStatusClass(status: BookingStatus): string {
    if (this.isStatus(status, BookingStatus.Confirmed)) return 'bg-green-100 text-green-800';
    if (this.isStatus(status, BookingStatus.Cancelled)) return 'bg-red-100 text-red-800';
    if (this.isStatus(status, BookingStatus.Pending)) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  }
}
