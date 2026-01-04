
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// import { environment } from '../../../../environments/environment';

import {
    StartSimulationDto,
    UpdateSimulationDetailsDto,
    UploadSimulationMediaDto,
    SimulationGoalsDto,
    SimulationResultDto,
    Property
} from '../models/renovation.models';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class RenovationApiService {
    private http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiBaseUrl}/renovation-simulations`;

    startSimulation(dto: StartSimulationDto): Observable<{ simulationId: number }> {
        return this.http.post<{ simulationId: number }>(`${this.baseUrl}/start`, dto);
    }

    /*getUserProperties(): Observable<Property[]> {
        return this.http.get<Property[]>(`${environment.apiBaseUrl}/property/owner`);
    }*/

    /*getUserProperties(): Observable<Property[]> {
        const ownerId = 1; // مؤقتًا، بعدين من التوكن
        return this.http.post<Property[]>(
            `${environment.apiBaseUrl}/property/owner`,
            { id: ownerId }
        );
    }*/
   
getUserProperties(): Observable<Property[]> {
    return this.http.get<Property[]>(
        `${environment.apiBaseUrl}/property/my`
    );
}


    updateDetails(id: number, dto: UpdateSimulationDetailsDto): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/${id}/details`, dto);
    }

    uploadMedia(id: number, dto: UploadSimulationMediaDto): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/${id}/media`, dto);
    }

    setGoals(id: number, dto: SimulationGoalsDto): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/${id}/goals`, dto);
    }

    completeSimulation(id: number): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/${id}/complete`, {});
    }
    analyzeSimulation(id: number) {
        return this.http.post(
            `${this.baseUrl}/${id}/analyze`,
            {}
        );
    }

    generateRecommendations(id: number): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/${id}/generate-recommendations`, {});
    }

    getResults(id: number): Observable<SimulationResultDto> {
        return this.http.get<SimulationResultDto>(`${this.baseUrl}/${id}`);
    }
}
