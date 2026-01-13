import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Property, PropertyService } from './property.service';
import { catchError } from 'rxjs/operators';

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

export enum PropertyComparisonUserType {
    Investor = 0,
    Family = 1,
    BudgetBuyer = 2
}

export interface PropertyComparisonRequestDTO {
    propertyIds: number[];
    userType: PropertyComparisonUserType;
}

export interface CategoryScoreDetailDTO {
    score: number;
    description: string;
}

export interface CategoryScoresDTO {
    priceValue: CategoryScoreDetailDTO;
    location: CategoryScoreDetailDTO;
    spaceAndLayout: CategoryScoreDetailDTO;
    features: CategoryScoreDetailDTO;
    investmentPotential: CategoryScoreDetailDTO;
}

export interface AiPropertyScoreBreakdownDTO {
    propertyId: number;
    categoryScores: CategoryScoresDTO;
    totalScore: number;
    overallReason: string;
}

export interface AiComparisonResultDTO {
    bestPropertyId: number;
    summary: string;
    scores: AiPropertyScoreBreakdownDTO[];
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

    constructor(
        private http: HttpClient,
        private propertyService: PropertyService
    ) {
        this.loadFromStorage();
    }

    addToCompare(id: number): boolean {
        if (this.comparisonIds.length >= 5 || this.comparisonIds.includes(id)) {
            return false;
        }

        this.comparisonIds.push(id);
        this.saveToStorage();
        this.refreshComparisonData();
        return true;
    }

    removeFromCompare(propertyId: number): void {
        this.comparisonIds = this.comparisonIds.filter(id => id !== propertyId);
        this.saveToStorage();

        const currentList = this.comparisonListSubject.value
            .filter(p => p.propertyID !== propertyId);

        this.comparisonListSubject.next(currentList);

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

        const requests = this.comparisonIds.map(id =>
            this.propertyService.getPropertyById(id).pipe(
                catchError(err => {
                    console.error(`Failed to load property ${id}`, err);
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
                    let thumb = p.thumbnailUrl || p.ThumbnailUrl;
                    if (!thumb && p.mediaUrls && p.mediaUrls.length > 0) {
                        thumb = p.mediaUrls[0];
                    }

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
                        thumbnailUrl: thumb || '',
                        features: []
                    };
                });

                this.comparisonListSubject.next(dtos);
            },
            error: err => {
                console.error('Error fetching comparison data', err);
            }
        });
    }

    analyzeWithAi(userType: PropertyComparisonUserType): Observable<AiComparisonResultDTO> {
        const payload: PropertyComparisonRequestDTO = {
            propertyIds: this.comparisonIds,
            userType
        };

        return this.http.post<AiComparisonResultDTO>(
            `${this.apiUrl}/compare`,
            payload
        );
    }

    getMyProperties(): Observable<Property[]> {
        return this.http.get<Property[]>(`${this.apiUrl}/my`);
    }

    getAllProperties(page: number = 1, pageSize: number = 12): Observable<any> {
        return this.http.get(
            `${this.apiUrl}/all?page=${page}&pageSize=${pageSize}`
        );
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
