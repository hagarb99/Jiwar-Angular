import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, catchError, tap, filter } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Property, PropertyService } from './property.service';
import { AuthService } from './auth.service';

export interface WishlistDto {
    id: number;
    userID: string;
    propertyID: number;
    addedDate: string;
    notes?: string;
}

@Injectable({
    providedIn: 'root'
})
export class WishlistService {
    private http = inject(HttpClient);
    private propertyService = inject(PropertyService);
    private authService = inject(AuthService);
    private readonly apiUrl = `${environment.apiBaseUrl}/wishlist`;

    private wishlistSubject = new BehaviorSubject<Property[]>([]);
    private wishlistIdsSubject = new BehaviorSubject<Set<number>>(new Set());

    constructor() {
        this.authService.isLoggedIn$.subscribe(isLoggedIn => {
            if (isLoggedIn) {
                this.loadWishlist();
            } else {
                this.wishlistSubject.next([]);
                this.wishlistIdsSubject.next(new Set());
            }
        });
    }

    /**
     * Get the current wishlist properties as an observable
     */
    get wishlist$(): Observable<Property[]> {
        return this.wishlistSubject.asObservable();
    }

    /**
     * Get the set of wishlist property IDs as an observable
     */
    get wishlistIds$(): Observable<Set<number>> {
        return this.wishlistIdsSubject.asObservable();
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
        return this.wishlistIdsSubject.value.has(propertyId);
    }

    /**
     * Load the wishlist from the server
     */
    loadWishlist(): void {
        this.http.get<WishlistDto[]>(this.apiUrl).pipe(
            tap(dtos => {
                const ids = new Set(dtos.map(d => d.propertyID));
                this.wishlistIdsSubject.next(ids);
            }),
            switchMap(dtos => {
                if (dtos.length === 0) return of([]);
                // Fetch details for each property
                const requests = dtos.map(dto =>
                    this.propertyService.getPropertyById(dto.propertyID).pipe(
                        catchError(() => of(null)) // Handle case where property might be deleted
                    )
                );
                return forkJoin(requests).pipe(
                    map(properties => properties.filter((p): p is Property => p !== null))
                );
            })
        ).subscribe({
            next: (properties) => {
                this.wishlistSubject.next(properties);
            },
            error: (err) => {
                console.error('Failed to load wishlist:', err);
                // Optionally handle 401 Unauthorized if needed, but interceptor should handle it or user needs to login
            }
        });
    }

    /**
     * Add a property to the wishlist
     */
    addToWishlist(propertyId: number, notes?: string): Observable<any> {
        return this.http.post(this.apiUrl, { propertyID: propertyId, notes }).pipe(
            tap(() => {
                // Optimistic update
                const currentIds = this.wishlistIdsSubject.value;
                currentIds.add(propertyId);
                this.wishlistIdsSubject.next(new Set(currentIds));

                // Reload full list to be sure and get details if needed
                this.loadWishlist();
            })
        );
    }

    /**
     * Remove a property from the wishlist
     */
    removeFromWishlist(propertyId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${propertyId}`).pipe(
            tap(() => {
                // Optimistic update
                const currentIds = this.wishlistIdsSubject.value;
                currentIds.delete(propertyId);
                this.wishlistIdsSubject.next(new Set(currentIds));

                // Filter current list without reloading everything for smoother UX
                const currentList = this.wishlistSubject.value;
                this.wishlistSubject.next(currentList.filter(p => (p.propertyID || p.id) !== propertyId));
            })
        );
    }

    /**
     * Toggle a property in the wishlist
     */
    toggleWishlist(propertyId: number): Observable<any> {
        if (this.isInWishlist(propertyId)) {
            return this.removeFromWishlist(propertyId);
        } else {
            return this.addToWishlist(propertyId);
        }
    }

    /**
     * Clear the entire wishlist (removes items one by one as backend doesn't show clear endpoint)
     * Or we could implement if backend supported it. For now, we will just clear locally provided the user clears them one by one?
     * The previous implementation had clearAll. The backend doesn't support clear all.
     * We will iterate and delete.
     */
    clearWishlist(): void {
        const items = this.wishlistSubject.value;
        const requests = items.map(p => this.removeFromWishlist(p.propertyID || p.id!));
        forkJoin(requests).subscribe(() => this.loadWishlist());
    }

    /**
     * Get the count of items in the wishlist
     */
    get count(): number {
        return this.wishlistIdsSubject.value.size;
    }
}
