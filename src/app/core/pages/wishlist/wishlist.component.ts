import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, Heart, Trash2, Search, ShoppingBag } from 'lucide-angular';
import { WishlistService } from '../../services/wishlist.service';
import { Property, PropertyType } from '../../services/property.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-wishlist',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        LucideAngularModule,
        NavbarComponent,
        FooterComponent
    ],
    templateUrl: './wishlist.component.html',
    styleUrls: ['./wishlist.component.css']
})
export class WishlistComponent implements OnInit {
    private wishlistService = inject(WishlistService);
    private router = inject(Router);

    // Icons
    Heart = Heart;
    Trash2 = Trash2;
    Search = Search;
    ShoppingBag = ShoppingBag;

    wishlistItems: Property[] = [];

    ngOnInit() {
        this.wishlistService.wishlist$.subscribe(items => {
            this.wishlistItems = items;
        });
    }

    removeFromWishlist(propertyId: number, event: Event) {
        event.stopPropagation();
        this.wishlistService.removeFromWishlist(propertyId);
    }

    clearAll() {
        if (confirm('Are you sure you want to clear your entire wishlist?')) {
            this.wishlistService.clearWishlist();
        }
    }

    goToProperty(property: Property) {
        const id = property.propertyID || property.id;
        this.router.navigate(['/property-details', id]);
    }

    goToSearch() {
        this.router.navigate(['/properties']);
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
        if (type === undefined) return 'Property';
        switch (type) {
            case PropertyType.Apartment: return 'Apartment';
            case PropertyType.Villa: return 'Villa';
            case PropertyType.House: return 'House';
            case PropertyType.Studio: return 'Studio';
            default: return 'Property';
        }
    }

    getThumbnailUrl(property: Property): string {
        const fallbackImage = '/logo2.png';

        if (property.mediaUrls && property.mediaUrls.length > 0) {
            const url = property.mediaUrls[0];
            if (url.startsWith('http')) return url;
            const apiBase = environment.apiBaseUrl;
            const cleanBase = apiBase.endsWith('/api') ? apiBase.replace('/api', '') : apiBase;
            const cleanPath = url.startsWith('/') ? url.substring(1) : url;
            return `${cleanBase}/${cleanPath}`;
        }

        if (property.thumbnailUrl) {
            if (property.thumbnailUrl.startsWith('http')) return property.thumbnailUrl;
            const apiBase = environment.apiBaseUrl;
            const cleanBase = apiBase.endsWith('/api') ? apiBase.replace('/api', '') : apiBase;
            const cleanPath = property.thumbnailUrl.startsWith('/') ? property.thumbnailUrl.substring(1) : property.thumbnailUrl;
            return `${cleanBase}/${cleanPath}`;
        }

        return fallbackImage;
    }
}
