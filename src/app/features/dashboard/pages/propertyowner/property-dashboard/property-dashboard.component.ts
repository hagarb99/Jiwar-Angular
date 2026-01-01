import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Property, PropertyService } from '../../../../../core/services/property.service';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-property-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './property-dashboard.component.html',
  styleUrls: ['./property-dashboard.component.css']
})
export class PropertyDashboardComponent implements OnInit {
  // User information
  username = 'Owner'; // This would typically come from auth service

  // Overview stats
  overviewStats = [
    {
      label: 'Total Listings',
      value: '0',
      icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
      bg: 'bg-blue-50'
    },
    {
      label: 'Active Bookings',
      value: '0',
      icon: 'M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10a2 2 0 002 2h4a2 2 0 002-2V11M9 11h6',
      bg: 'bg-green-50'
    },
    {
      label: 'Total Earnings',
      value: '0 EGP',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
      bg: 'bg-yellow-50'
    },
    {
      label: 'Overall Rating',
      value: '4.8',
      sub: 'Based on 24 reviews',
      icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
      bg: 'bg-purple-50'
    }
  ];

  // Financial data
  monthlyEarnings = '15,750 EGP';
  yearlyEarnings = '142,500 EGP';
  pendingPayments = '3,200 EGP';

  // Properties
  properties: Property[] = [];
  isLoading = false;

  // Mock bookings data
  bookings = [
    { id: 1, property: 'Modern Villa in Maadi', client: 'Ahmed Hassan', date: 'Jan 15, 2026', status: 'pending', amount: '2,500 EGP' },
    { id: 2, property: 'Luxury Apartment Downtown', client: 'Sara Mohamed', date: 'Jan 12, 2026', status: 'confirmed', amount: '3,200 EGP' },
  ];

  // Recent reviews
  recentReviews = [
    { id: 1, client: 'Ahmed Hassan', property: 'Modern Villa in Maadi', rating: 5, comment: 'Excellent property with great amenities!', date: 'Dec 20, 2025' },
    { id: 2, client: 'Sara Mohamed', property: 'Luxury Apartment Downtown', rating: 4, comment: 'Very clean and well-maintained.', date: 'Dec 18, 2025' },
  ];

  constructor(
    private propertyService: PropertyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMyProperties();
  }

  private loadMyProperties(): void {
    this.isLoading = true;
    this.propertyService.getMyProperties().subscribe({
      next: (data) => {
        this.properties = data;
        // Update overview stats with real data
        this.overviewStats[0].value = data.length.toString(); // Total Listings
        this.overviewStats[1].value = this.bookings.filter(b => b.status === 'confirmed').length.toString(); // Active Bookings
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  navigateToAddProperty(): void {
    this.router.navigate(['/add-property']);
  }

  getThumbnailUrl(property: Property): string {
    const fallbackImage = '/logo2.png';
  
    if (!property) {
      console.log('Property is null/undefined');
      return fallbackImage;
    }
  
    console.log('Property data:', {
      propertyID: property.propertyID,
      title: property.title,
      ThumbnailUrl: property.ThumbnailUrl,
      thumbnailUrl: property.thumbnailUrl
    });
  
    // Use ThumbnailUrl from backend (PropertyListBDTO) - similar to other working components
    if (property.ThumbnailUrl) {
      console.log('Using ThumbnailUrl:', property.ThumbnailUrl);
      // If it's already a full URL, use it
      if (property.ThumbnailUrl.startsWith('http')) {
        return property.ThumbnailUrl;
      }
  
      // Build full URL from relative path using API base URL (like other components)
      const apiBase = environment.apiBaseUrl;
      const cleanBase = apiBase.endsWith('/api') ? apiBase.replace('/api', '') : apiBase;
      const cleanPath = property.ThumbnailUrl.startsWith('/') ? property.ThumbnailUrl.substring(1) : property.ThumbnailUrl;
      const finalBase = cleanBase.endsWith('/') ? cleanBase.slice(0, -1) : cleanBase;
  
      const result = `${finalBase}/${cleanPath}`;
      console.log('Final ThumbnailUrl result:', result);
      return result;
    }
  
    // Fallback to thumbnailUrl for backward compatibility with other endpoints
    if (property.thumbnailUrl) {
      console.log('Using thumbnailUrl:', property.thumbnailUrl);
      // If it's already a full URL, use it
      if (property.thumbnailUrl.startsWith('http')) {
        return property.thumbnailUrl;
      }
  
      // Build full URL from relative path using API base URL
      const apiBase = environment.apiBaseUrl;
      const cleanBase = apiBase.endsWith('/api') ? apiBase.replace('/api', '') : apiBase;
      const cleanPath = property.thumbnailUrl.startsWith('/') ? property.thumbnailUrl.substring(1) : property.thumbnailUrl;
      const finalBase = cleanBase.endsWith('/') ? cleanBase.slice(0, -1) : cleanBase;
  
      const result = `${finalBase}/${cleanPath}`;
      console.log('Final thumbnailUrl result:', result);
      return result;
    }
  
    console.log('Using fallback image:', fallbackImage);
    return fallbackImage;
  }

  onImageError(event: any): void {
    event.target.src = '/logo2.png';
  }

  getCurrentUser() {
    try {
      const userJson = localStorage.getItem('currentUser');
      return userJson ? JSON.parse(userJson) : {};
    } catch {
      return {};
    }
  }

}
