import { Component, Input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, Heart } from 'lucide-angular';
import { WishlistService } from '../../../core/services/wishlist.service';
import { Property } from '../../../core/services/property.service';

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 hover:shadow-2xl hover:shadow-yellow-500/10 transition-all duration-500 cursor-pointer" [class.md:col-span-2]="size === 'large' || size === 'medium'" [class.md:row-span-2]="size === 'large'">
      
      <div class="aspect-[4/3] overflow-hidden relative" (click)="goToDetails()">
        <img [src]="image || '/logo2.png'" [alt]="title" class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div class="absolute top-4 left-4 flex gap-2">
          <span class="px-3 py-1 rounded-lg bg-white/95 backdrop-blur-sm text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider shadow-sm border border-yellow-100">{{ type }}</span>
          <span class="px-3 py-1 rounded-lg bg-[#D4AF37]/95 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">{{ purpose }}</span>
        </div>
      </div>

      <button (click)="toggleWishlist($event)" class="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all z-10" [ngClass]="{'bg-red-50': isInWishlist, 'bg-white/95 backdrop-blur': !isInWishlist}">
        <lucide-angular [img]="Heart" class="w-5 h-5 transition-colors" [ngClass]="{'text-red-500 fill-red-500': isInWishlist, 'text-gray-400': !isInWishlist}"></lucide-angular>
      </button>
      
      <div class="p-5" (click)="goToDetails()">
        <div class="flex justify-between items-start mb-2">
          <h3 class="text-lg font-bold text-gray-900 group-hover:text-[#D4AF37] transition-colors line-clamp-1 flex-1">{{ title }}</h3>
          <p class="text-[#D4AF37] font-extrabold text-lg ml-2">{{ price }}</p>
        </div>
        
        <p class="text-gray-400 text-sm flex items-center gap-1.5">
          <svg class="w-4 h-4 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          {{ location }}
        </p>

        <div class="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
          <span class="text-xs font-bold text-gray-300 group-hover:text-[#D4AF37] transition-colors flex items-center gap-1">
            View Details
            <svg class="w-3 h-3 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
        :host { display: block; }
        .line-clamp-1 {
            overflow: hidden;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 1;
            line-clamp: 1;
        }
    `]
})
export class PropertyCardComponent implements OnInit {
  private router = inject(Router);
  private wishlistService = inject(WishlistService);

  Heart = Heart;

  @Input() id: number | undefined;
  @Input() propertyID: number | undefined;
  @Input() image: string = '';
  @Input() type: string = '';
  @Input() purpose: string = '';
  @Input() title: string = '';
  @Input() location: string = '';
  @Input() price: string = '';
  @Input() size: 'small' | 'medium' | 'large' = 'small';
  @Input() propertyData: Property | undefined;

  isInWishlist = false;

  ngOnInit() {
    const idToUse = this.propertyID || this.id;
    if (idToUse) {
      this.isInWishlist = this.wishlistService.isInWishlist(idToUse);
    }

    this.wishlistService.wishlist$.subscribe(() => {
      const idToCheck = this.propertyID || this.id;
      if (idToCheck) {
        this.isInWishlist = this.wishlistService.isInWishlist(idToCheck);
      }
    });
  }

  goToDetails() {
    const idToUse = this.propertyID || this.id;
    if (idToUse) {
      this.router.navigate(['/property-details', idToUse]);
    }
  }

  toggleWishlist(event: Event) {
    event.stopPropagation();
    const idToUse = this.propertyID || this.id;

    if (idToUse && this.propertyData) {
      this.isInWishlist = this.wishlistService.toggleWishlist(this.propertyData);
    } else if (idToUse) {
      const minimalProperty: Property = {
        propertyID: this.propertyID || 0,
        id: this.id,
        title: this.title,
        district: this.location,
        price: 0,
        description: '',
        address: '',
        city: '',
        locationLat: 0,
        locationLang: 0,
        ownerName: '',
        mediaUrls: [this.image]
      };
      this.isInWishlist = this.wishlistService.toggleWishlist(minimalProperty);
    }
  }
}
