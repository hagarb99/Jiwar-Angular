// property.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Define interfaces matching your backend models
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
    locationLat: number;
    locationLang: number;
    ownerName: string;
    mediaUrls: string[];
    publishedAt?: string;
    propertyType?: PropertyType;
    thumbnailUrl?: string; // Still used by browse endpoint for card display
    ThumbnailUrl?: string; // Used by /my endpoint (PropertyListBDTO)
    propertyMedia?: PropertyMedia[]; // Still used by some endpoints
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
    private apiUrl = environment.apiBaseUrl + '/property';

    constructor(private http: HttpClient) { }

    getFilteredProperties(filter: PropertyFilterDTO): Observable<Property[]> {
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

        return this.http.get<Property[]>(`${this.apiUrl}/browse`, { params });
    }

    getPropertyById(id: number): Observable<Property> {
        return this.http.get<Property>(`${this.apiUrl}/${id}`);
    }

    
  addProperty(dto: any, images: File[]): Observable<any> {
   const formData = new FormData();
formData.append('title', dto.title);
formData.append('description', dto.description);
formData.append('price', dto.price.toString());
formData.append('address', dto.address);
formData.append('city', dto.city);
formData.append('listingType', dto.listingType.toString());
if(dto.district) formData.append('district', dto.district);
if(dto.area) formData.append('area', dto.area.toString());
if(dto.rooms) formData.append('rooms', dto.rooms.toString());
if(dto.bathrooms) formData.append('bathrooms', dto.bathrooms.toString());
formData.append('categoryId', dto.categoryId.toString());
if(dto.tour360Url) formData.append('tour360Url', dto.tour360Url);
if(dto.locationLat) formData.append('locationLat', dto.locationLat.toString());
if(dto.locationLang) formData.append('locationLang', dto.locationLang.toString());

images.forEach(file => formData.append('Images', file));
    return this.http.post(`${this.apiUrl}/add`, formData);
  }

getMyProperties(): Observable<Property[]> {
  return this.http.get<Property[]>(`${this.apiUrl}/my`);
}



}