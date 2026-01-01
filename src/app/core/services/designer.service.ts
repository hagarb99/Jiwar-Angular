import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiBaseService } from './api-base.service';
import { Observable } from 'rxjs';

export interface Designer {
    id: string;
    name: string;
    email: string;
    profilePicURL: string;
    title?: string;
    location?: string;
    bio?: string;
    specializations?: string[];
    certifications?: string[];
    hourlyRate?: number;
    projectMinimum?: number;
    yearsOfExperience?: number;
}

@Injectable({
    providedIn: 'root'
})
export class DesignerService extends ApiBaseService {

    constructor(httpClient: HttpClient) {
        super(httpClient);
    }

    /** Get all interior designers */
    getAllDesigners(): Observable<Designer[]> {
        return this.httpClient.get<Designer[]>(`${this.apiBaseUrl}/account/designers`);
    }

    /** Search designers by name */
    searchDesignersByName(name: string): Observable<Designer[]> {
        return this.httpClient.get<Designer[]>(`${this.apiBaseUrl}/account/designers/search?name=${encodeURIComponent(name)}`);
    }

    /** Get designer by ID */
    getDesignerById(id: string): Observable<Designer> {
        return this.httpClient.get<Designer>(`${this.apiBaseUrl}/account/designers/${id}`);
    }
}

