import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Property } from './property.service';

@Injectable({
    providedIn: 'root'
})
export class WishlistService {
    private readonly STORAGE_KEY = 'jiwar_wishlist';
    private wishlistSubject = new BehaviorSubject<Property[]>(this.loadFromStorage());

    constructor() { }

    /**
     * Get the current wishlist as an observable
     */
    get wishlist$(): Observable<Property[]> {
        return this.wishlistSubject.asObservable();
    }

    /**
     * Get the current wishlist value
     */
    get wishlist(): Property[] {
        return this.wishlistSubject.value;
    }

    /**
     * Check if a property is in the wishlist
     */
    isInWishlist(propertyId: number): boolean {
        return this.wishlist.some(p => (p.propertyID || p.id) === propertyId);
    }

    /**
     * Add a property to the wishlist
     */
    addToWishlist(property: Property): void {
        const propertyId = property.propertyID || property.id;
        if (!this.isInWishlist(propertyId!)) {
            const updated = [...this.wishlist, property];
            this.saveToStorage(updated);
            this.wishlistSubject.next(updated);
        }
    }

    /**
     * Remove a property from the wishlist
     */
    removeFromWishlist(propertyId: number): void {
        const updated = this.wishlist.filter(p => (p.propertyID || p.id) !== propertyId);
        this.saveToStorage(updated);
        this.wishlistSubject.next(updated);
    }

    /**
     * Toggle a property in the wishlist
     */
    toggleWishlist(property: Property): boolean {
        const propertyId = property.propertyID || property.id;
        if (this.isInWishlist(propertyId!)) {
            this.removeFromWishlist(propertyId!);
            return false;
        } else {
            this.addToWishlist(property);
            return true;
        }
    }

    /**
     * Clear the entire wishlist
     */
    clearWishlist(): void {
        this.saveToStorage([]);
        this.wishlistSubject.next([]);
    }

    /**
     * Get the count of items in the wishlist
     */
    get count(): number {
        return this.wishlist.length;
    }

    private loadFromStorage(): Property[] {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    private saveToStorage(wishlist: Property[]): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(wishlist));
        } catch (e) {
            console.error('Failed to save wishlist to storage:', e);
        }
    }
}
