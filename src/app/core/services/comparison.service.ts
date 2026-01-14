import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Property, PropertyService } from './property.service';
import { catchError, tap, map } from 'rxjs/operators';
import { PropertyComparisonUserType } from '../models/property-comparison-user-type.enum';
import {
    AiComparisonResultDTO
} from '../models/ai-comparison-result.dto';
import { PropertyComparisonDTO, PropertyComparisonRequestDTO } from '../models/comparison.model';


@Injectable({
    providedIn: 'root'
})
export class ComparisonService {
    private comparisonIds: number[] = [];
    private comparisonListSubject = new BehaviorSubject<PropertyComparisonDTO[]>([]);
    comparisonList$ = this.comparisonListSubject.asObservable();

    constructor(
        private http: HttpClient,
        private propertyService: PropertyService
    ) {
        this.loadFromLocalStorage();
    }

    addToComparison(property: PropertyComparisonDTO): boolean {
        if (this.comparisonIds.length >= 5) return false;

        if (!this.comparisonIds.includes(property.propertyID)) {
            this.comparisonIds.push(property.propertyID);
            this.saveToLocalStorage();
            this.refreshComparisonData();
            return true;
        }
        return false;
    }

    addToCompare(id: number): boolean {
        if (this.comparisonIds.length >= 5) return false;

        if (!this.comparisonIds.includes(id)) {
            this.comparisonIds.push(id);
            this.saveToLocalStorage();
            this.refreshComparisonData();
            return true;
        }
        return false;
    }

    removeFromComparison(id: number): void {
        this.comparisonIds = this.comparisonIds.filter(cid => cid !== id);
        this.saveToLocalStorage();
        this.refreshComparisonData();
    }

    removeFromCompare(id: number): void {
        this.removeFromComparison(id);
    }

    isInComparison(id: number): boolean {
        return this.comparisonIds.includes(id);
    }

    clearComparison(): void {
        this.comparisonIds = [];
        this.saveToLocalStorage();
        this.refreshComparisonData();
    }

    analyzeWithAi(userType: PropertyComparisonUserType): Observable<AiComparisonResultDTO> {
        const url = `${environment.apiBaseUrl}/property/compare`;
        const request: PropertyComparisonRequestDTO = {
            propertyIds: this.comparisonIds,
            userType: userType
        };

        return this.http.post<AiComparisonResultDTO>(url, request);
    }

    private refreshComparisonData(): void {
        if (this.comparisonIds.length === 0) {
            this.comparisonListSubject.next([]);
            return;
        }

        const requests = this.comparisonIds.map(id =>
            this.propertyService.getPropertyById(id).pipe(
                catchError(err => {
                    console.error(`Error fetching property ${id}`, err);
                    return of(null);
                })
            )
        );

        forkJoin(requests).subscribe({
            next: (results: (Property | null)[]) => {
                const validProperties = results.filter(
                    (p): p is Property => p !== null
                );

                const dtos: PropertyComparisonDTO[] = validProperties.map(p => {
                    return {
                        propertyID: p.propertyID,
                        title: p.title,
                        city: p.city,
                        address: p.address,
                        price: p.price,
                        area_sqm: p.area_sqm,
                        numBedrooms: p.numBedrooms,
                        numBathrooms: p.numBathrooms,
                        propertyType: p.propertyType?.toString() ?? 'Unknown',
                        status: 'Available',
                        thumbnailUrl: this.getThumbnailUrl(p),
                        features: []
                    };
                });

                this.comparisonListSubject.next(dtos);
            }
        });
    }

    public getThumbnailUrl(property: Property): string {
        const fallbackImage = '/logo2.png';
        let thumb = property.thumbnailUrl || property.ThumbnailUrl;

        if (!thumb && property.mediaUrls && property.mediaUrls.length > 0) {
            thumb = property.mediaUrls[0];
        }

        if (!thumb) return fallbackImage;
        if (thumb.startsWith('http')) return thumb;

        const apiBase = environment.apiBaseUrl;
        const cleanBase = apiBase.endsWith('/api') ? apiBase.replace('/api', '') : apiBase;
        const cleanPath = thumb.startsWith('/') ? thumb.substring(1) : thumb;
        const finalBase = cleanBase.endsWith('/') ? cleanBase.slice(0, -1) : cleanBase;

        return `${finalBase}/${cleanPath}`;
    }

    private saveToLocalStorage(): void {
        localStorage.setItem('property_comparison_ids', JSON.stringify(this.comparisonIds));
    }

    private loadFromLocalStorage(): void {
        const saved = localStorage.getItem('property_comparison_ids');
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
