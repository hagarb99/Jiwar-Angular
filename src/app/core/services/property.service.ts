// property.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Define interfaces matching your backend models
export interface PropertyOwner {
    userId: string;
    name: string;
    profilePicURL?: string;
    phoneNumber?: string;
}

export interface BookingCreateDTO {
    propertyID: number;
    startDate: string; // ISO format
    message?: string;
    phone: string;
    email: string;
    name: string;
    offerID?: number | null; // 0 -> null في backend
}
export interface Property {
    propertyID: number;
    id?: number; // fallback
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
    tour3DUrl?: string;
    locationLat: number;
    locationLang: number;
    ownerName: string;
    mediaUrls: string[];
    publishedAt?: string;
    propertyType?: PropertyType;
    thumbnailUrl?: string; // Still used by browse endpoint for card display
    ThumbnailUrl?: string; // Used by /my endpoint (PropertyListBDTO)
    propertyMedia?: PropertyMedia[]; // Still used by some endpoints
    propertyOwner?: PropertyOwner;
    canChat?: boolean;
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
    Studio = 2,
    Office = 3,
    EmptyLand = 4,
    Duplex = 5,
    Shop = 6,
    Garage = 7,
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
    listingType?: number;
}

export interface PropertyAnalytics {
    propertyID: number;
    fairValue_Estimate: number;
    price_Influence_Factors: string;
    analysisDate: string;
}

export interface VirtualTour {
    propertyID: number;
    userID: string;
    tourURL: string;
    tourTitle: string;
    description: string;
    createdDate: string;
}

@Injectable({
    providedIn: 'root'
})
export class PropertyService {
    private apiUrl = environment.apiBaseUrl + '/property';

    constructor(private http: HttpClient) { }

    getPropertyAnalytics(id: number): Observable<PropertyAnalytics[]> {
        return this.http.get<PropertyAnalytics[]>(`${this.apiUrl}/${id}/analytics`);
    }

    getFilteredProperties(filter: PropertyFilterDTO): Observable<any> {
        let params = new HttpParams();

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
            params = params.set('propertyType', filter.propertyType.toString());
        }
        if (filter.listingType !== null && filter.listingType !== undefined) {
            params = params.set('listingType', filter.listingType.toString());
        }

        return this.http.get<any>(`${this.apiUrl}/browse`, { params });
    }

    getPropertyById(id: number): Observable<Property> {
        return this.http.get<Property>(`${this.apiUrl}/${id}`);
    }

    getVirtualTours(propertyId: number): Observable<VirtualTour[]> {
        return this.http.get<VirtualTour[]>(`${this.apiUrl}/${propertyId}/tours`);
    }


    addProperty(dto: any, images: File[]): Observable<any> {
        const formData = new FormData();
        formData.append('title', dto.title);
        formData.append('description', dto.description);
        formData.append('price', dto.price.toString());
        formData.append('address', dto.address);
        formData.append('city', dto.city);
        formData.append('listingType', dto.listingType.toString());
        if (dto.district) formData.append('district', dto.district);
        if (dto.area) formData.append('area', dto.area.toString());
        if (dto.rooms) formData.append('rooms', dto.rooms.toString());
        if (dto.bathrooms) formData.append('bathrooms', dto.bathrooms.toString());
        formData.append('categoryId', dto.categoryId.toString());
        if (dto.tour360Url) formData.append('tour360Url', dto.tour360Url);
        if (dto.locationLat) formData.append('locationLat', dto.locationLat.toString());
        if (dto.locationLang) formData.append('locationLang', dto.locationLang.toString());

        images.forEach(file => {
            const sanitizedFile = this.sanitizeFile(file);
            formData.append('Images', sanitizedFile);
        });
        return this.http.post(`${this.apiUrl}/add`, formData);
    }

    getMyProperties(): Observable<Property[]> {
        return this.http.get<Property[]>(`${this.apiUrl}/my`);
    }

    getAllProperties(): Observable<Property[]> {
        return this.http.get<Property[]>(`${this.apiUrl}/all`);
    }

    // property.service.ts

    updateProperty(id: number, dto: any, images?: File[]): Observable<any> {
        // Always use FormData for consistency with addProperty
        const formData = new FormData();

        // Add text fields
        formData.append('title', dto.title);
        formData.append('description', dto.description || '');
        formData.append('price', dto.price.toString());
        formData.append('address', dto.address);
        formData.append('city', dto.city);
        if (dto.district) formData.append('district', dto.district);
        if (dto.area_sqm !== null && dto.area_sqm !== undefined) {
            formData.append('area_sqm', dto.area_sqm.toString());
        }
        if (dto.numBedrooms !== null && dto.numBedrooms !== undefined) {
            formData.append('numBedrooms', dto.numBedrooms.toString());
        }
        if (dto.numBathrooms !== null && dto.numBathrooms !== undefined) {
            formData.append('numBathrooms', dto.numBathrooms.toString());
        }
        if (dto.tour360Url) formData.append('tour360Url', dto.tour360Url);

        // Add images if provided
        if (images && images.length > 0) {
            images.forEach(file => {
                const sanitizedFile = this.sanitizeFile(file);
                formData.append('Images', sanitizedFile);
            });
        }

        return this.http.put(`${this.apiUrl}/update/${id}`, formData);
    }

    deleteProperty(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
    createBooking(booking: BookingCreateDTO) {
        return this.http.post(`${environment.apiBaseUrl}/Booking`, booking);
    }

    private sanitizeFile(file: File): File {
        const extension = file.name.split('.').pop() || 'jpg';
        const guid = (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(2, 11);
        return new File([file], `${guid}.${extension}`, { type: file.type });
    }
}