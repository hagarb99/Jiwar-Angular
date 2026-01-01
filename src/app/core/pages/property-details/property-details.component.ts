import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LucideAngularModule, MapPin, Maximize2, Bed, Bath, Heart, Share2, Calendar, Phone, Mail, User, Info } from 'lucide-angular';
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
  propertyId: number = 0;
  selectedImageIndex = 0;
  isFavorite = false;

  safeTourUrl: SafeResourceUrl | null = null;
  safeMapUrl: SafeResourceUrl | null = null;

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.propertyId = +params['id'];
      if (this.propertyId) {
        this.fetchPropertyDetails();
      } else {
        this.errorMessage = 'Invalid property ID';
        this.loading = false;
      }
    });
  }

  fetchPropertyDetails() {
    this.loading = true;
    this.errorMessage = '';

    this.propertyService.getPropertyById(this.propertyId).subscribe({
      next: (data) => {
        this.property = data;
        if (data.tour360Url) {
          this.safeTourUrl = this.sanitizer.bypassSecurityTrustResourceUrl(data.tour360Url);
        }

        // Handle map coordinates
        if (data.locationLat && data.locationLang) {
          const mapUrl = `https://maps.google.com/maps?q=${data.locationLat},${data.locationLang}&z=15&output=embed`;
          this.safeMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(mapUrl);
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching property:', error);
        this.errorMessage = 'Failed to load property details. Please try again later.';
        this.loading = false;
      }
    });
  }

  selectImage(index: number) {
    this.selectedImageIndex = index;
  }

  handleShare() {
    const shareData = {
      title: this.property?.title,
      text: this.property?.description,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData).catch(err => console.log('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied successfully!');
    }
  }

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }

  handleBooking() {
    this.router.navigate(['/booking', this.propertyId]);
  }

  formatPrice(price: number | undefined): string {
    if (price === undefined) return '0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(price);
  }

  getPropertyTypeName(type: PropertyType | undefined): string {
    if (type === undefined) return '';
    switch (type) {
      case PropertyType.Apartment: return 'Apartment';
      case PropertyType.Villa: return 'Villa';
      case PropertyType.House: return 'House';
      case PropertyType.Studio: return 'Studio';
      default: return 'Property';
    }
  }

  goBack() {
    this.router.navigate(['/properties']);
  }

  // getMediaUrls(): string[] {
  //   if (!this.property) return [];
  //   let urls: string[] = [];

  //   // Use MediaUrls from DTO if available
  //   if (this.property.mediaUrls && this.property.mediaUrls.length > 0) {
  //     urls = this.property.mediaUrls;
  //   } else {
  //     // Fallback logic
  //     if (this.property.thumbnailUrl) {
  //       urls.push(this.property.thumbnailUrl);
  //     }
  //     if (this.property.propertyMedia) {
  //       this.property.propertyMedia.forEach(m => urls.push(m.mediaURL));
  //     }
  //   }

  //   // Fix URLs to be absolute
  //   return urls.map(url => this.fixUrl(url));
  // }

  // private fixUrl(url: string): string {
  //   if (!url) return '';
  //   if (url.startsWith('http')) return url;

  //   // Remove /api from base URL and constructed absolute path
  //   const apiBase = environment.apiBaseUrl;
  //   const cleanBase = apiBase.endsWith('/api') ? apiBase.replace('/api', '') : apiBase;
  //   const finalBase = cleanBase.endsWith('/') ? cleanBase.slice(0, -1) : cleanBase;
  //   const cleanPath = url.startsWith('/') ? url.substring(1) : url;

  //   return `${finalBase}/${cleanPath}`;
  // }
  getMediaUrls(): string[] {
    if (!this.property) return [];

    let urls: string[] = [];

    // الأولوية الأولى: لو الـ backend بعت mediaUrls جاهزة
    if (this.property.mediaUrls && this.property.mediaUrls.length > 0) {
      urls = this.property.mediaUrls.map(url => this.fixUrl(url));
    }
    // الأولوية الثانية: استخدام propertyMedia (مع فلترة المحذوفات وترتيب حسب order)
    else if (this.property.propertyMedia && this.property.propertyMedia.length > 0) {
      const validMedia = this.property.propertyMedia
        .filter(m => !m.isDeleted)                    // تجاهل الصور المحذوفة
        .sort((a, b) => a.order - b.order);           // ترتيب حسب الأولوية

      if (validMedia.length > 0) {
        urls = validMedia.map(m => this.fixUrl(m.mediaURL));
      }
    }
    // الأولوية الثالثة: الاعتماد على thumbnailUrl
    else if (this.property.thumbnailUrl) {
      urls = [this.fixUrl(this.property.thumbnailUrl)];
    }

    // لو مفيش صور خالص، هيرجع مصفوفة فاضية (والـ template هيعرض placeholder)
    return urls;
  }
  onImageError(event: any) {
    event.target.src = '/assets/placeholder.jpg'; // أو '/logo2.png' زي صفحة البحث
  }


  private fixUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;

    // إزالة /api من base URL لو موجودة
    const apiBase = environment.apiBaseUrl;
    const cleanBase = apiBase.endsWith('/api') ? apiBase.replace('/api', '') : apiBase;

    // تنظيف المسار
    const cleanPath = url.startsWith('/') ? url.substring(1) : url;

    // التأكد من إن الـ base مش منتهي بـ /
    const finalBase = cleanBase.endsWith('/') ? cleanBase.slice(0, -1) : cleanBase;

    return `${finalBase}/${cleanPath}`;
  }
}
