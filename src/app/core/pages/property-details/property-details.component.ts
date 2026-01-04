
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { PropertyCardComponent } from '../../../shared/components/property-card/property-card.component';
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
import { PropertyService, Property, PropertyType, PropertyAnalytics, VirtualTour } from '../../services/property.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { environment } from '../../../../environments/environment';
import { WishlistService } from '../../services/wishlist.service';
import { AuthService } from '../../services/auth.service';
import { AdminAnalyticsService } from '../../services/admin-analytics.service';
import { AdminAnalyticsDTO, TopDistrictDTO, TopCategoryDTO } from '../../models/admin-analytics.dto';
import { SafeUrlPipe } from '../../../shared/pipes/safe-url.pipe';

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
    PropertyCardComponent,
    SafeUrlPipe
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
  private adminAnalyticsService = inject(AdminAnalyticsService);

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
  virtualTours: (VirtualTour & { safeUrl: SafeResourceUrl })[] = [];
  activeTourUrl: string = '';
  showTour: boolean = false;

  // Analytics Data
  priceHistory: { year: number, price: number, percentage: number }[] = [];
  adminAnalytics: AdminAnalyticsDTO | null = null;
  averageGrowth = 0;
  fairValueEstimate: number | null = null;
  influenceFactors: string[] = [];

  // Helper Methods
  isTopDistrict(): boolean {
    if (!this.adminAnalytics || !this.property) return false;
    return this.adminAnalytics.propertyMetrics.topDistricts?.some(
      (d: TopDistrictDTO) => d.districtName.toLowerCase() === this.property?.district.toLowerCase()
    ) || false;
  }

  isTopCategory(): boolean {
    if (!this.adminAnalytics || !this.property) return false;
    const typeName = this.getPropertyTypeName(this.property.propertyType).toLowerCase();
    return this.adminAnalytics.propertyMetrics.topCategories?.some(
      (c: TopCategoryDTO) => c.categoryName.toLowerCase() === typeName
    ) || false;
  }

  parseInfluenceFactors(factorsJson?: string): string[] {
    if (!factorsJson) return [];
    try {
      const parsed = JSON.parse(factorsJson);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return factorsJson.split(',').map(s => s.trim()).filter(s => s);
    }
  }

  getGrowthStatus(): { label: string, color: string, icon: any } {
    if (this.averageGrowth > 0) return { label: 'Increasing', color: 'text-green-600', icon: TrendingUp };
    if (this.averageGrowth < 0) return { label: 'Decreasing', color: 'text-red-600', icon: TrendingUp };
    return { label: 'Stable', color: 'text-gray-600', icon: Activity };
  }

  getMarketDemandLevel(): string {
    if (!this.adminAnalytics) return 'Moderate';
    const activeUsers = this.adminAnalytics.usersMetrics.activeUsers || 0;
    if (activeUsers > 1000) return 'Viral';
    if (activeUsers > 500) return 'Very High';
    if (activeUsers > 100) return 'High';
    return 'Moderate';
  }

  getMarketActivity(): string {
    if (!this.adminAnalytics) return 'Normal';
    const valuations = this.adminAnalytics.valuationMetrics.valuationsPerPeriod['Month'] || 0;
    if (valuations > 200) return 'Dynamic';
    if (valuations > 100) return 'Active';
    return 'Stable';
  }

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
        this.loadMarketAnalytics();
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
    this.authService.currentUser$.subscribe((user: any) => {
      if (user) {
        this.bookingData.name = user.name || '';
        this.bookingData.email = user.email || '';
        this.bookingData.phone = user.phoneNumber || '';
      }
    });
  }

  loadMarketAnalytics(): void {
    this.adminAnalyticsService.getAnalytics().subscribe({
      next: (data: AdminAnalyticsDTO) => {
        this.adminAnalytics = data;
      },
      error: (err: any) => console.error('Error fetching market analytics:', err)
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
      next: (data: Property) => {
        this.property = data;
        this.selectedImageIndex = 0;

        // Load Analytics Data
        this.loadAnalytics(id);

        // Load Virtual Tours
        this.loadVirtualTours(id);

        // 360° Tour (Primary fallback if dedicated tours table is empty)
        if (data.tour360Url) {
          const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.getTourEmbedUrl(data.tour360Url));
          this.safeTourUrl = safeUrl;
          this.activeTourUrl = data.tour360Url;

          // Seed virtualTours if empty to ensure UI appears
          if (this.virtualTours.length === 0) {
            this.virtualTours = [{
              propertyID: id,
              tourURL: data.tour360Url,
              tourTitle: 'Property 3D Tour',
              description: 'Interactive virtual exploration of this property.',
              createdDate: new Date().toISOString(),
              safeUrl: safeUrl
            } as any];
          }
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
      error: (err: any) => {
        console.error('Error fetching property details:', err);
        this.errorMessage = 'Failed to load property details. Please try again later.';
        this.loading = false;
      }
    });
  }

  loadVirtualTours(id: number): void {
    this.propertyService.getVirtualTours(id).subscribe({
      next: (tours: VirtualTour[]) => {
        // Only override if we got actual dynamic tours
        if (tours && tours.length > 0) {
          this.virtualTours = tours.map(t => ({
            ...t,
            safeUrl: this.sanitizer.bypassSecurityTrustResourceUrl(this.getTourEmbedUrl(t.tourURL))
          }));

          this.safeTourUrl = this.virtualTours[0].safeUrl;
          this.activeTourUrl = this.virtualTours[0].tourURL;
        }
      },
      error: (err: any) => console.error('Error fetching virtual tours:', err)
    });
  }

  selectTour(tour: VirtualTour & { safeUrl: SafeResourceUrl }): void {
    this.safeTourUrl = tour.safeUrl;
    this.activeTourUrl = tour.tourURL;
  }

  private getTourEmbedUrl(url: string): string {
    if (!url) return '';
    // Basic YouTube/Vimeo support if they are used as tours
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('youtu.be/')) {
      return url.replace('youtu.be/', 'youtube.com/embed/');
    }
    return url;
  }

  loadAnalytics(id: number): void {
    this.propertyService.getPropertyAnalytics(id).subscribe({
      next: (data: PropertyAnalytics[]) => {
        if (data && data.length > 0) {
          // Sort by date ascending
          const sorted = data.sort((a, b) => new Date(a.analysisDate).getTime() - new Date(b.analysisDate).getTime());

          this.priceHistory = sorted.map((a, index) => {
            const prevPrice = index > 0 ? sorted[index - 1].fairValue_Estimate : a.fairValue_Estimate;
            const percentage = index > 0 ? ((a.fairValue_Estimate - prevPrice) / prevPrice) * 100 : 0;

            return {
              year: new Date(a.analysisDate).getFullYear(),
              price: a.fairValue_Estimate,
              percentage: Math.round(percentage)
            };
          });

          // Set Fair Value Estimate to the latest one
          const latest = sorted[sorted.length - 1];
          this.fairValueEstimate = latest.fairValue_Estimate;
          this.influenceFactors = this.parseInfluenceFactors(latest.price_Influence_Factors);

          // Calculate Average Growth
          const growthValues = this.priceHistory.filter(h => h.percentage !== 0).map(h => h.percentage);
          if (growthValues.length > 0) {
            this.averageGrowth = growthValues.reduce((a, b) => a + b, 0) / growthValues.length;
          }

          // Take last 5 if too many
          if (this.priceHistory.length > 5) {
            this.priceHistory = this.priceHistory.slice(-5);
          }
        }
      },
      error: (err: any) => {
        console.error('Error fetching analytics:', err);
      }
    });
  }

  getMaxPriceInHistory(): number {
    if (this.priceHistory.length === 0) return 2500000;
    const max = Math.max(...this.priceHistory.map(h => h.price));
    return max > 0 ? max * 1.1 : 2500000; // Add 10% headroom
  }

  loadRecommendedProperties() {
    this.propertyService.getFilteredProperties({}).subscribe({
      next: (data: Property[]) => {
        this.recommendedProperties = data
          .filter(p => p.propertyID !== this.propertyId)
          .map(p => ({
            ...p,
            thumbnailUrl: p.thumbnailUrl ? this.fixUrl(p.thumbnailUrl) : undefined,
            mediaUrls: p.mediaUrls ? p.mediaUrls.map(u => this.fixUrl(u)) : []
          }))
          .slice(0, 3);
      },
      error: (err: any) => console.error('Failed to load recommended properties', err)
    });
  }

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
    const mediaCount = this.getMediaUrls().length;
    if (mediaCount === 0) return;
    this.selectedImageIndex = (this.selectedImageIndex - 1 + mediaCount) % mediaCount;
  }

  nextImage(): void {
    const mediaCount = this.getMediaUrls().length;
    if (mediaCount === 0) return;
    this.selectedImageIndex = (this.selectedImageIndex + 1) % mediaCount;
  }

  toggleFavorite(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.propertyId) {
      const wasFavorite = this.isFavorite;
      // Optimistic UI update
      this.isFavorite = !this.isFavorite;
      console.log('Toggling favorite for ID:', this.propertyId);

      // If we just added it to favorites, navigate immediately
      if (this.isFavorite) {
        console.log('Directly navigating to wishlist...');
        this.router.navigate(['/wishlist']);
      }

      this.wishlistService.toggleWishlist(this.propertyId).subscribe({
        next: () => {
          console.log('Favorite toggle success. Current isFavorite:', this.isFavorite);
        },
        error: (err) => {
          console.error('Error toggling wishlist:', err);
          // Revert on error
          this.isFavorite = wasFavorite;
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
    console.log('Booking Data:', this.bookingData);
    alert('Thank you! Your viewing request has been received. We will contact you shortly.');
    this.closeBookingModal();
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
    } else if (this.property.propertyMedia?.length) {
      urls = this.property.propertyMedia
        .filter(m => !m.isDeleted)
        .sort((a, b) => a.order - b.order)
        .map(m => this.fixUrl(m.mediaURL));
    } else if (this.property.thumbnailUrl) {
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
