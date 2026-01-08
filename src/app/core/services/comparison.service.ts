import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Property } from './property.service';

export interface PropertyComparisonDTO {
    propertyID: number;
    title: string;
    city: string;
    address: string;
    price: number;
    area_sqm?: number;
    numBedrooms?: number;
    numBathrooms?: number;
    propertyType: string;
    status: string;
    thumbnailUrl: string;
    ThumbnailUrl?: string;
    features: string[];
}

@Injectable({
    providedIn: 'root'
})
export class ComparisonService {
    private apiUrl = environment.apiBaseUrl + '/property';
    private comparisonListSubject = new BehaviorSubject<PropertyComparisonDTO[]>([]);
    comparisonList$ = this.comparisonListSubject.asObservable();
    private comparisonIds: number[] = [];

    private readonly STORAGE_KEY = 'jiwar_comparison_ids';

    constructor(private http: HttpClient) {
        this.loadFromStorage();
    }

    addToCompare(id: number): boolean {
        if (this.comparisonIds.length >= 5) {
            return false; // Limit to 5 properties (per backend constraint)
        }

        if (this.comparisonIds.includes(id)) {
            return false; // Already in list
        }

        this.comparisonIds.push(id);
        this.saveToStorage();
        this.refreshComparisonData();
        return true;
    }

    removeFromCompare(propertyId: number): void {
        this.comparisonIds = this.comparisonIds.filter(id => id !== propertyId);
        this.saveToStorage();

        // Optimistic update
        const currentList = this.comparisonListSubject.value.filter(p => p.propertyID !== propertyId);
        this.comparisonListSubject.next(currentList);

        // Refresh to ensure sync if needed, but optimistic is usually fine here
        if (this.comparisonIds.length > 0) {
            this.refreshComparisonData();
        }
    }

    isInComparison(propertyId: number): boolean {
        return this.comparisonIds.includes(propertyId);
    }

    clearComparison(): void {
        this.comparisonIds = [];
        this.comparisonListSubject.next([]);
        localStorage.removeItem(this.STORAGE_KEY);
    }

    refreshComparisonData(): void {
        if (this.comparisonIds.length === 0) {
            this.comparisonListSubject.next([]);
            return;
        }

        this.http.post<PropertyComparisonDTO[]>(`${this.apiUrl}/compare`, this.comparisonIds)
            .subscribe({
                next: (data) => {
                    this.comparisonListSubject.next(data);
                },
                error: (err) => {
                    console.error('Error fetching comparison data', err);
                    // If error (e.g., some properties deleted), maybe clear custom handling?
                }
            });
    }

    getMyProperties(): Observable<Property[]> {
        return this.http.get<Property[]>(`${this.apiUrl}/my`);
    }

    // Helper to get all properties for browsing (if needed by simple browser)
    getAllProperties(page: number = 1, pageSize: number = 12): Observable<any> {
        return this.http.get(`${this.apiUrl}/all?page=${page}&pageSize=${pageSize}`);
    }

    private saveToStorage(): void {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.comparisonIds));
    }

    private loadFromStorage(): void {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            try {
                this.comparisonIds = JSON.parse(saved);
                this.refreshComparisonData();
            } catch (e) {
                console.error('Error loading comparison IDs', e);
                this.comparisonIds = [];
            }
        }
    }
}
