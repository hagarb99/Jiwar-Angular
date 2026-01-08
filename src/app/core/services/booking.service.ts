import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from './api-base.service';

export interface Booking {
  id: number;
  propertyID: number;
  propertyTitle: string;
  customerName: string;
  startDate: string;
  endDate?: string;
  cost: number;
  status: BookingStatus; // Pending, Confirmed, Rejected
}
export enum BookingStatus {
  Pending = 0,
  Confirmed = 1,
  Cancelled = 2
}


export interface CustomerBooking {
  id: number;
  propertyID: number;
  propertyTitle: string;
  startDate: string;
  endDate?: string;
  status: BookingStatus; // 0 = Pending, 1 = Confirmed, 2 = Rejected
}


@Injectable({ providedIn: 'root' })
export class BookingService {

  constructor(private http: HttpClient,
   private apiBaseURL : ApiBaseService
  ) {}
  getCustomerBookings(): Observable<CustomerBooking[]> {
    return this.http.get<CustomerBooking[]>(`${this.apiBaseURL.apiBaseUrl}/Booking/customer`);
  }
  getOwnerBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiBaseURL.apiBaseUrl}/Booking/owner`);
  }

  updateBookingStatus(bookingId: number, status: BookingStatus) {
    return this.http.put(`${this.apiBaseURL.apiBaseUrl}/Booking/${bookingId}/status`, { status });
  } 
  
}

