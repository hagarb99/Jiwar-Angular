
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
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { PropertyService, Property, PropertyType, PropertyAnalytics, VirtualTour } from '../../services/property.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { PanoramaViewerComponent } from '../../../shared/components/panorama-viewer/panorama-viewer.component';
import { environment } from '../../../../environments/environment';
import { WishlistService } from '../../services/wishlist.service';
import { AuthService } from '../../services/auth.service';
import { AdminAnalyticsService } from '../../services/admin-analytics.service';
import { AdminAnalyticsDTO, TopDistrictDTO, TopCategoryDTO } from '../../models/admin-analytics.dto';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

export interface BookingCreateDTO {
  propertyID: number;
  startDate: string; // ISO format
  message?: string;
  phone: string;
  email: string;
  name: string;
  offerID?: number | null; // 0 -> null في backend
}




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
    ToastModule,
    PanoramaViewerComponent
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
  private messageService = inject(MessageService);

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
  isPanoramaImage: boolean = false;

  // Analytics Data
  priceHistory: { year: number, price: number, percentage: number }[] = [];
  adminAnalytics: AdminAnalyticsDTO | null = null;
  averageGrowth = 0;
  fairValueEstimate: number | null = null;
  influenceFactors: string[] = [];

  // Chart Properties
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Property Price',
        fill: true,
        tension: 0.4,
        borderColor: '#D4AF37',
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        pointBackgroundColor: '#fff',
        pointBorderColor: '#D4AF37',
        pointHoverBackgroundColor: '#D4AF37',
        pointHoverBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 3
      }
    ]
  };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111827',
        titleColor: '#fff',
        bodyColor: '#D4AF37',
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context) => {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumSignificantDigits: 3 }).format(context.parsed.y || 0);
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false, color: 'transparent' },
        ticks: { color: '#9CA3AF', font: { size: 12, weight: 'bold' } }
      },
      y: {
        display: false,
        grid: { display: false }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    }
  };
  public lineChartType: 'line' = 'line';

  // Computed Analytics
  public totalGrowth = 0;
  public highestPriceYear = 0;
  public averagePrice = 0;
  public chartInsight = '';

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
          this.isPanoramaImage = this.checkIsPanoramaImage(data.tour360Url);
          if (this.isPanoramaImage) {
            this.activeTourUrl = data.tour360Url;
          } else {
            const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.getTourEmbedUrl(data.tour360Url));
            this.safeTourUrl = safeUrl;
            this.activeTourUrl = data.tour360Url;
          }

          // Seed virtualTours if empty to ensure UI appears
          if (this.virtualTours.length === 0) {
            this.virtualTours = [{
              propertyID: id,
              tourURL: data.tour360Url,
              tourTitle: 'Property 3D Tour',
              description: 'Interactive virtual exploration of this property.',
              createdDate: new Date().toISOString(),
              safeUrl: !this.isPanoramaImage ? this.safeTourUrl : null
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
    this.isPanoramaImage = this.checkIsPanoramaImage(tour.tourURL);
    this.safeTourUrl = tour.safeUrl;
    this.activeTourUrl = tour.tourURL;
  }

  private checkIsPanoramaImage(url: string): boolean {
    if (!url) return false;
    const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const lowerUrl = url.toLowerCase().split('?')[0];
    return extensions.some(ext => lowerUrl.endsWith(ext)) || url.includes('storage.jiwar.com/panoramas/');
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

          // Set Fair Value Estimate and Influence Factors from real data
          const latest = sorted[sorted.length - 1];
          this.fairValueEstimate = latest.fairValue_Estimate;
          this.influenceFactors = this.parseInfluenceFactors(latest.price_Influence_Factors);

          const growthValues = this.priceHistory.filter(h => h.percentage !== 0).map(h => h.percentage);
          if (growthValues.length > 0) {
            this.averageGrowth = growthValues.reduce((a, b) => a + b, 0) / growthValues.length;
          }
        } else {
          // Simulated Data Fallback to ensure the chart is "drawn" as requested
          const basePrice = this.property?.price || 1200000;
          const currentYear = new Date().getFullYear();
          this.priceHistory = Array.from({ length: 10 }, (_, i) => {
            const year = currentYear - (9 - i);
            const variance = 0.8 + (i * 0.03) + (Math.random() * 0.05);
            return {
              year,
              price: Math.round(basePrice * variance),
              percentage: i === 0 ? 0 : 3
            };
          });

          this.highestPriceYear = currentYear;
          this.fairValueEstimate = this.priceHistory[this.priceHistory.length - 1].price;
          this.influenceFactors = ['Location Strategy', 'Market Demand', 'Property Condition'];
        }

        // Filter for last 10 years as requested
        const tenYearsAgo = new Date().getFullYear() - 10;
        const filteredHistory = this.priceHistory.filter(h => h.year >= tenYearsAgo);

        // Update Chart Data
        // We need to create a new object reference to trigger change detection in ng2-charts
        this.lineChartData = {
          labels: filteredHistory.map(h => h.year.toString()),
          datasets: [
            {
              ...this.lineChartData.datasets[0],
              data: filteredHistory.map(h => h.price)
            }
          ]
        };

        // Calculate Additional Metrics
        if (filteredHistory.length > 1) {
          const firstPrice = filteredHistory[0].price;
          const lastPrice = filteredHistory[filteredHistory.length - 1].price;
          this.totalGrowth = ((lastPrice - firstPrice) / firstPrice) * 100;
          this.highestPriceYear = filteredHistory.reduce((max, curr) => curr.price > max.price ? curr : max, filteredHistory[0]).year;
          this.averagePrice = filteredHistory.reduce((sum, curr) => sum + curr.price, 0) / filteredHistory.length;

          // AI Insight
          if (this.totalGrowth > 20) {
            this.chartInsight = "This property shows a strong upward price trend, significantly outperforming market averages over the last decade.";
          } else if (this.totalGrowth > 5) {
            this.chartInsight = "This property shows a steady and consistent upward price trend over the last decade.";
          } else if (this.totalGrowth > -5) {
            this.chartInsight = "This property has maintained a stable value with minimal fluctuations over the last decade.";
          } else {
            this.chartInsight = "This property has seen a price correction in recent years, presenting a potential value opportunity.";
          }
        }

        // Take last 5 if too many (OLD LOGIC - REMOVING or KEEPING for table if used elsewhere?)
        if (this.priceHistory.length > 10) {
          this.priceHistory = this.priceHistory.slice(-10);
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
    if (!this.propertyId) return;

    // Validate required fields
    if (!this.bookingData.name || !this.bookingData.email || !this.bookingData.phone || !this.bookingData.date) {
      alert('Please fill all required fields.');
      return;
    }

    // Prepare payload
    const bookingPayload: BookingCreateDTO = {
      propertyID: this.propertyId,
      name: this.bookingData.name,
      email: this.bookingData.email,
      phone: this.bookingData.phone,
      startDate: new Date(this.bookingData.date).toISOString(), // تحويل للتنسيق ISO
      message: this.bookingData.message || '',
      offerID: null // backend يتوقع null بدل 0
    };

    // Disable multiple submissions
    let isSubmitting = true;

    this.propertyService.createBooking(bookingPayload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Booking Submitted',
          detail: 'Your booking request has been sent successfully! The property owner will review it shortly.',
          life: 5000
        });
        this.closeBookingModal();
        // Reset only message and date, keep user info
        this.bookingData.date = '';
        this.bookingData.message = '';
        isSubmitting = false;
      },
      error: (err) => {
        let errorMessage = 'Failed to submit booking. Please try again later.';
        if (err.status === 400) {
          errorMessage = 'Invalid booking data. Please check your information and try again.';
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Booking Failed',
          detail: errorMessage,
          life: 5000
        });

        console.error('Booking failed:', err);
        isSubmitting = false;
      }
    });
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
