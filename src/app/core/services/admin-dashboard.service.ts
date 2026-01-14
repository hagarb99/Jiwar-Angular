import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiBaseService } from './api-base.service';

export interface AdminUserDto {
    id: string;
    userName: string;
    email: string;
    phoneNumber?: string;
    role: string;
    registrationDate: Date;
    isActive: boolean;
}

export interface AdminPropertyDto {
    id: number;
    title: string;
    city: string;
    ownerName: string;
    status: number; // PropEnum
    price?: number;
    createdDate: Date;
}

export interface AdminWishlistDto {
    id: number;
    userId: string;
    propertyId: number;
    userName: string;
    propertyTitle: string;
    addedDate: Date;
    notes?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AdminDashboardService extends ApiBaseService {

    constructor(httpClient: HttpClient) {
        super(httpClient);
    }

    // USERS
    getAllUsers(): Observable<AdminUserDto[]> {
        return this.httpClient.get<AdminUserDto[]>(`${this.apiBaseUrl}/admin/dashboard/users`);
    }

    deleteUser(userId: string): Observable<string> {
        return this.httpClient.delete<string>(`${this.apiBaseUrl}/admin/dashboard/users/${userId}`);
    }

    toggleUserStatus(userId: string): Observable<any> {
        return this.httpClient.post(`${this.apiBaseUrl}/admin/dashboard/users/${userId}/toggle-status`, {});
    }

    // PROPERTIES
    getAllProperties(): Observable<AdminPropertyDto[]> {
        return this.httpClient.get<AdminPropertyDto[]>(`${this.apiBaseUrl}/admin/dashboard/properties`);
    }

    updatePropertyStatus(propertyId: number, status: number): Observable<string> {
        return this.httpClient.put<string>(
            `${this.apiBaseUrl}/admin/dashboard/properties/${propertyId}/status`,
            null,
            { params: { statusEnum: status.toString() } }
        );
    }

    // WISHLIST
    getAllWishlists(): Observable<AdminWishlistDto[]> {
        return this.httpClient.get<AdminWishlistDto[]>(`${this.apiBaseUrl}/admin/dashboard/wishlists`);
    }
}
