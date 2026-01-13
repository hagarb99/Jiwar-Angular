import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PropertyOwnerService, PropertyOwnerPublicProfile } from '../../../../../../core/services/PropertyOwnerService';
import { Property, PropertyService } from '../../../../../../core/services/property.service';
import { NavbarComponent } from '../../../../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../../../../shared/components/footer/footer.component';
import { PropertyCardComponent } from '../../../../../../shared/components/property-card/property-card.component';
import { environment } from '../../../../../../../environments/environment';
@Component({
  selector: 'app-property-owner-public-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, FooterComponent, PropertyCardComponent],
  templateUrl: './property-owner-public-profile.component.html',
  styleUrl: './property-owner-public-profile.component.css'
})
export class PropertyOwnerPublicProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly propertyOwnerService = inject(PropertyOwnerService);
  private readonly propertyService = inject(PropertyService);

  profile?: PropertyOwnerPublicProfile;
  properties: Property[] = [];
  isLoading = true;
  hasError = false;

  ngOnInit(): void {
    // 1. الحصول على الـ ID من الرابط (URL)
    const ownerId = this.route.snapshot.paramMap.get('id');

    if (ownerId) {
      this.loadOwnerProfile(ownerId);
    }
  }

  loadOwnerProfile(id: string) {
    this.propertyOwnerService.getPublicProfile(id).subscribe({
      next: (data) => {
        this.profile = data.owner; // بيانات المالك (الاسم، البايو، الصورة)
        this.properties = data.properties; // قائمة العقارات
      },
      error: (err) => console.error('Error loading profile', err)
    });
  }

  private loadProfile(userId: string) {
    this.isLoading = true;

    // 1️⃣ Fetch owner profile
    this.propertyOwnerService.getPublicProfile(userId).subscribe({
      next: (profile: PropertyOwnerPublicProfile) => {
        this.profile = profile;

        // 2️⃣ Fetch properties and filter by owner locally
        // ideally backend should have an endpoint for this, but efficient enough for now
        this.propertyService.getFilteredProperties({}).subscribe({
          next: (allProperties: Property[]) => {
            this.properties = allProperties.filter(p => p.propertyOwner?.userId === userId);

            // Fix image URLs
            this.properties.forEach(p => {
              if (p.thumbnailUrl) p.thumbnailUrl = this.fixUrl(p.thumbnailUrl);
              if (p.mediaUrls) p.mediaUrls = p.mediaUrls.map(u => this.fixUrl(u));
            });

            this.isLoading = false;
          },
          error: () => {
            console.error("Failed to load properties");
            this.isLoading = false;
            // Don't fail the whole page if properties fail
          }
        });
      },
      error: () => {
        this.hasError = true;
        this.isLoading = false;
      }
    });
  }

  getProfileImageUrl(url: string | undefined | null): string {
    if (!url) {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.profile?.name || 'User'}`;
    }
    return this.fixUrl(url);
  }

  private fixUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const apiBase = environment.apiBaseUrl.replace(/\/api\/?$/, '');
    return `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`;
  }
}
