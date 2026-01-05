
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { PropertyCardComponent } from '../../../shared/components/property-card/property-card.component';
import { PropertyOwnerPublicProfile } from '../../services/PropertyOwnerService';
import {
  LucideAngularModule,
  MapPin,
  Maximize2,
  Bed,
  Bath,
  Heart,
  Share2,
  Calendar,
  Phone,
  Mail,
  User,
  Info,
  X,
  ClipboardCheck,
  Key,
  Eye,
  Wifi,
  Car,
  Shield,
  Activity,
  Star,
  CheckCircle,
  Wallet,
  PieChart,
  TrendingUp,
  LineChart,
  ChevronLeft,
  ChevronRight
} from 'lucide-angular';
import { PropertyService, Property, PropertyType } from '../../services/property.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { environment } from '../../../../environments/environment';
import { WishlistService } from '../../services/wishlist.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LucideAngularModule,
    NavbarComponent,
    FooterComponent,
    PropertyCardComponent
  ],
  templateUrl: './property-details.component.html',
  styleUrls: ['./property-details.component.css']
})
export class PropertyDetailsComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private propertyService = inject(PropertyService);
  private wishlistService = inject(WishlistService);
  private authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);

  // Icons
  MapPin = MapPin;
  Maximize2 = Maximize2;
  Bed = Bed;
  Bath = Bath;
  Heart = Heart;
  Share2 = Share2;
  Calendar = Calendar;
  Phone = Phone;
  Mail = Mail;
  User = User;
  Info = Info;
  X = X;
  ClipboardCheck = ClipboardCheck;
  Key = Key;
  Eye = Eye;
  Wifi = Wifi;
  Car = Car;
  Shield = Shield;
  Activity = Activity;
  Star = Star;
  CheckCircle = CheckCircle;
  Wallet = Wallet;
  PieChart = PieChart;
  TrendingUp = TrendingUp;
  LineChart = LineChart;
  ChevronLeft = ChevronLeft;
  ChevronRight = ChevronRight;

  property: Property | null = null;
  recommendedProperties: Property[] = [];
  loading = true;
  errorMessage = '';
  propertyId = 0;

  selectedImageIndex = 0;
  isFavorite = false;
  isImageModalOpen = false;

  safeTourUrl: SafeResourceUrl | null = null;
  safeMapUrl: SafeResourceUrl | null = null;

  // Static Amenities for Demo
  amenities = [
    { icon: Wifi, label: 'High-Speed Wifi' },
    { icon: Car, label: 'Private Parking' },
    { icon: Shield, label: '24/7 Security' },
    { icon: Activity, label: 'Gym & Fitness' },
    { icon: Star, label: 'Premium Finish' },
    { icon: CheckCircle, label: 'Smart Home' }
  ];

  // Navigation State
  activeSection = 'overview';

  scrollToSection(sectionId: string): void {
    this.activeSection = sectionId;
    const element = document.getElementById(sectionId);
    if (element) {
      // Offset for the sticky navbar
      const headerOffset = 120;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }

  // Price Analytics Data
  priceHistory = [
    { year: 2020, price: 1000000, percentage: 0 },
    { year: 2021, price: 1150000, percentage: 15 },
    { year: 2022, price: 1300000, percentage: 13 },
    { year: 2023, price: 1600000, percentage: 23 },
    { year: 2024, price: 2100000, percentage: 31 }
  ];

  // Booking Modal State
  isBookingModalOpen = false;
  bookingData = {
    name: '',
    phone: '',
    email: '',
    date: '',
    message: ''
  };

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id')); // Ensure 'id' matches your route config
      if (id) {
        this.propertyId = id; // Set propertyId for other methods
        this.loadProperty(id);
        this.checkWishlistStatus(); // Check wishlist status after propertyId is set
        this.loadRecommendedProperties();
      } else {
        this.errorMessage = 'Invalid Property ID';
        this.loading = false;
      }
    });

    // Subscribe to wishlist changes to keep UI in sync
    this.wishlistService.wishlistIds$.subscribe(() => {
      this.checkWishlistStatus();
    });

    // Pre-fill user data if logged in
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.bookingData.name = user.name || '';
        this.bookingData.email = user.email || '';
        this.bookingData.phone = user.phoneNumber || '';
      }
    });
  }

  checkWishlistStatus(): void {
    if (this.propertyId) {
      this.isFavorite = this.wishlistService.isInWishlist(this.propertyId);
    }
  }



  loadProperty(id: number): void {
    this.loading = true;
    this.errorMessage = '';
    this.propertyId = id;

    this.propertyService.getPropertyById(id).subscribe({
      next: (data) => {
        this.property = data;
        this.selectedImageIndex = 0;

        // 360° Tour
        if (data.tour360Url) {
          this.safeTourUrl =
            this.sanitizer.bypassSecurityTrustResourceUrl(data.tour360Url);
        }

        // Google Maps
        let mapUrl = '';

        if (
          data.locationLat &&
          data.locationLang &&
          (data.locationLat !== 0 || data.locationLang !== 0)
        ) {
          const lat = data.locationLat;
          const lng = data.locationLang;
          const zoom = 16;
          mapUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
        } else if (data.address || data.district || data.city) {
          // Construct search query
          const locationParts = [data.address, data.district, data.city]
            .filter(part => part) // remove empty/null
            .join(', ');

          if (locationParts) {
            // Use q=Address for search mode
            mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(locationParts)}&z=15&output=embed`;
          }
        }

        if (mapUrl) {
          this.safeMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(mapUrl);
        } else {
          this.safeMapUrl = null;
        }

        this.loading = false;

        // Load additional data dependent on property
        this.checkWishlistStatus();
      },
      error: (err) => {
        console.error('Error fetching property details:', err);
        this.errorMessage = 'Failed to load property details. Please try again later.';
        this.loading = false;
      }
    });
  }

  loadRecommendedProperties() {
    // Mocking context: Fetch properties to show as "Recommended"
    // In a real app, you might pass the current property's category/location to filter
    this.propertyService.getFilteredProperties({}).subscribe({
      next: (data) => {
        // Simple logic: exclude current property and show top 3
        this.recommendedProperties = data
          .filter(p => p.propertyID !== this.propertyId)
          .slice(0, 3);
      },
      error: (err) => console.error('Failed to load recommended properties', err)
    });
  }

  // ================= UI Actions =================

  selectImage(index: number): void {
    this.selectedImageIndex = index;
  }

  openImageModal(index: number): void {
    this.selectedImageIndex = index;
    this.isImageModalOpen = true;
  }

  closeImageModal(): void {
    this.isImageModalOpen = false;
  }

  previousImage(): void {
    if (this.selectedImageIndex > 0) {
      this.selectedImageIndex--;
    } else {
      this.selectedImageIndex = this.getMediaUrls().length - 1;
    }
  }

  nextImage(): void {
    if (this.selectedImageIndex < this.getMediaUrls().length - 1) {
      this.selectedImageIndex++;
    } else {
      this.selectedImageIndex = 0;
    }
  }

  toggleFavorite(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.propertyId) {
      // Optimistic UI update
      this.isFavorite = !this.isFavorite;

      this.wishlistService.toggleWishlist(this.propertyId).subscribe({
        error: (err) => {
          console.error('Error toggling wishlist:', err);
          // Revert on error
          this.isFavorite = !this.isFavorite;
        }
      });
    }
  }

  handleBooking(): void {
    this.isBookingModalOpen = true;
  }

  closeBookingModal(): void {
    this.isBookingModalOpen = false;
  }

  submitBooking(): void {
    // In a real app, this would send data to the backend
    console.log('Booking Data:', this.bookingData);
    alert('Thank you! Your viewing request has been received. We will contact you shortly.');
    this.closeBookingModal();
    // Reset form
    this.bookingData.date = '';
    this.bookingData.message = '';
  }

  handleShare(): void {
    const shareData = {
      title: this.property?.title,
      text: this.property?.description,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => { });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied successfully');
    }
  }

  goBack(): void {
    this.router.navigate(['/properties']);
  }

  // ================= Helpers =================

  formatPrice(price?: number): string {
    if (!price) return '0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(price);
  }

  getPropertyTypeName(type?: PropertyType): string {
    switch (type) {
      case PropertyType.Apartment: return 'Apartment';
      case PropertyType.Villa: return 'Villa';
      case PropertyType.House: return 'House';
      case PropertyType.Studio: return 'Studio';
      default: return 'Property';
    }
  }

  getMediaUrls(): string[] {
    if (!this.property) return [];

    let urls: string[] = [];

    if (this.property.mediaUrls?.length) {
      urls = this.property.mediaUrls.map(u => this.fixUrl(u));
    }
    else if (this.property.propertyMedia?.length) {
      urls = this.property.propertyMedia
        .filter(m => !m.isDeleted)
        .sort((a, b) => a.order - b.order)
        .map(m => this.fixUrl(m.mediaURL));
    }
    else if (this.property.thumbnailUrl) {
      urls = [this.fixUrl(this.property.thumbnailUrl)];
    }

    return urls;
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = '/assets/placeholder.jpg';
  }

  private fixUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;

    const apiBase = environment.apiBaseUrl.replace(/\/api$/, '');
    const cleanPath = url.startsWith('/') ? url.substring(1) : url;

    return `${apiBase}/${cleanPath}`;
  }
}
