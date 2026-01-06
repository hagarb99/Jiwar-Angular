// Models for Customer Dashboard

import { Property } from '../services/property.service';

export interface CustomerPropertySummary {
  id: number;
  title: string;
  location: string;
  status: string;
  type: 'purchased' | 'rented';
}

export interface CustomerBookingSummary {
  id: number;
  property: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'canceled';
}

export interface DashboardStats {
  totalProperties: number;
  upcomingBookings: number;
  savedProperties: number;
  activeRequests: number;
}

