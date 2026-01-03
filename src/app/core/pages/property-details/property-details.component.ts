import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
  Info
} from 'lucide-angular';
import { PropertyService, Property, PropertyType } from '../../services/property.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
    NavbarComponent,
    FooterComponent
  ],
  templateUrl: './property-details.component.html',
  styleUrls: ['./property-details.component.css']
})
export class PropertyDetailsComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private propertyService = inject(PropertyService);
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

  property: Property | null = null;
  loading = true;
  errorMessage = '';
  propertyId = 0;

  selectedImageIndex = 0;
  isFavorite = false;

  safeTourUrl: SafeResourceUrl | null = null;
  safeMapUrl: SafeResourceUrl | null = null;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.propertyId = Number(params['id']);
      if (this.propertyId) {
        this.fetchPropertyDetails();
      } else {
        this.errorMessage = 'Invalid property ID';
        this.loading = false;
      }
    });
  }

  fetchPropertyDetails(): void {
    this.loading = true;
    this.errorMessage = '';

    this.propertyService.getPropertyById(this.propertyId).subscribe({
      next: (data) => {
        this.property = data;

        // 360° Tour
        if (data.tour360Url) {
          this.safeTourUrl =
            this.sanitizer.bypassSecurityTrustResourceUrl(data.tour360Url);
        }

        // ✅ Google Maps (الحل الصحيح)
        // Logic to determine map URL
        // 1. If valid coordinates exist (not 0,0), use them.
        // 2. Fallback to address search if coordinates are missing or invalid.
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
      },
      error: (err) => {
        console.error('Error fetching property details:', err);
        this.errorMessage = 'Failed to load property details. Please try again later.';
        this.loading = false;
      }
    });
  }

  // ================= UI Actions =================

  selectImage(index: number): void {
    this.selectedImageIndex = index;
  }

  toggleFavorite(): void {
    this.isFavorite = !this.isFavorite;
  }

  handleBooking(): void {
    this.router.navigate(['/booking', this.propertyId]);
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
