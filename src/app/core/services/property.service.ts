// property.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Define interfaces matching your backend models
export interface Property {
    id: number;
    title: string;
    district: string;
    price: number;
    area: number;
    numBedrooms: number;
    numBathrooms: number;
    propertyType: PropertyType;
    thumbnailUrl?: string; // Returned by browse endpoint
    propertyMedia?: PropertyMedia[]; // May be returned by detail endpoint
    // Add other properties as needed
}

export interface PropertyMedia {
    id: number;
    mediaURL: string;
    isDeleted: boolean;
    order: number;
}

export enum PropertyType {
    Apartment = 0,
    Villa = 1,
    House = 2,
    Studio = 3,
    // Add other types matching your backend enum
}

export interface PropertyFilterDTO {
    district?: string;
    minPrice?: number;
    maxPrice?: number;
    minArea?: number;
    maxArea?: number;
    numBedrooms?: number;
    numBathrooms?: number;
    propertyType?: PropertyType;
}

@Injectable({
    providedIn: 'root'
})
export class PropertyService {
    private apiUrl = environment.apiBaseUrl + '/property'; // Uses environment configuration

    constructor(private http: HttpClient) { }

    /**
     * Get filtered properties from the backend
     * @param filter PropertyFilterDTO with optional filter criteria
     * @returns Observable of Property array
     */
    getFilteredProperties(filter: PropertyFilterDTO): Observable<Property[]> {
        let params = new HttpParams();

        // Only add parameters that have values
        if (filter.district) {
            params = params.set('district', filter.district);
        }

        if (filter.minPrice !== null && filter.minPrice !== undefined) {
            params = params.set('minPrice', filter.minPrice.toString());
        }

        if (filter.maxPrice !== null && filter.maxPrice !== undefined) {
            params = params.set('maxPrice', filter.maxPrice.toString());
        }

        if (filter.minArea !== null && filter.minArea !== undefined) {
            params = params.set('minArea', filter.minArea.toString());
        }

        if (filter.maxArea !== null && filter.maxArea !== undefined) {
            params = params.set('maxArea', filter.maxArea.toString());
        }

        if (filter.numBedrooms !== null && filter.numBedrooms !== undefined) {
            params = params.set('numBedrooms', filter.numBedrooms.toString());
        }

        if (filter.numBathrooms !== null && filter.numBathrooms !== undefined) {
            params = params.set('numBathrooms', filter.numBathrooms.toString());
        }

        if (filter.propertyType !== null && filter.propertyType !== undefined) {
            // Send as numeric enum value
            params = params.set('propertyType', filter.propertyType.toString());
        }

        // Make GET request with query parameters
        return this.http.get<Property[]>(`${this.apiUrl}/browse`, { params });
    }
}