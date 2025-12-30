// property-details.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LucideAngularModule, MapPin, Maximize2, Bed, Bath, Heart, Share2, Calendar, Phone, Mail, User } from 'lucide-angular';

interface PropertyDetails {
  propertyID: number;
  title: string;
  description: string;
  price: number;
  address: string;
  city: string;
  district: string;
  area_sqm?: number;
  numBedrooms?: number;
  numBathrooms?: number;
  tour360Url?: string;
  locationLat: number;
  locationLang: number;
  ownerName: string;
  mediaUrls: string[];
  publishedAt?: string;
}

@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule
  ],
  templateUrl: './property-details.component.html',
  styleUrls: ['./property-details.component.css']
})
export class PropertyDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);

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

  property: PropertyDetails | null = null;
  loading = true;
  errorMessage = '';
  propertyId: number = 0;
  selectedImageIndex = 0;
  isFavorite = false;

  private apiUrl = 'https://your-api-url.com/api/Property'; // ضع رابط الـ API هنا

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.propertyId = +params['id'];
      this.fetchPropertyDetails();
    });
  }

  async fetchPropertyDetails() {
    try {
      this.loading = true;
      this.errorMessage = '';

      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        // أضف الـ Authorization token إذا كان مطلوب
        // 'Authorization': `Bearer ${localStorage.getItem('token')}`
      });

      this.http.get<PropertyDetails>(`${this.apiUrl}/${this.propertyId}`, { headers })
        .subscribe({
          next: (data) => {
            this.property = data;
            this.loading = false;
          },
          error: (error) => {
            console.error('Error fetching property:', error);
            this.errorMessage = 'فشل في تحميل تفاصيل العقار';
            this.loading = false;
          }
        });
    } catch (error: any) {
      console.error('Error:', error);
      this.errorMessage = 'حدث خطأ غير متوقع';
      this.loading = false;
    }
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
      // نسخ الرابط إلى الحافظة
      navigator.clipboard.writeText(window.location.href);
      alert('تم نسخ الرابط بنجاح!');
    }
  }

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
    // هنا يمكنك إضافة استدعاء API لحفظ المفضلة
    alert(this.isFavorite ? 'تمت الإضافة للمفضلة' : 'تمت الإزالة من المفضلة');
  }

  handleBooking() {
    // التوجه لصفحة الحجز
    this.router.navigate(['/booking', this.propertyId]);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(price);
  }

  goBack() {
    this.router.navigate(['/properties']);
  }
}

