
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    StartSimulationDto,
    UpdateSimulationDetailsDto,
    UploadSimulationMediaDto,
    SimulationGoalsDto,
    SimulationResultDto
} from '../models/renovation.models';

@Injectable({
    providedIn: 'root'
})
export class RenovationApiService {
    private http = inject(HttpClient);
    private readonly baseUrl = '/api/renovation-simulations';

    startSimulation(dto: StartSimulationDto): Observable<{ simulationId: number }> {
        return this.http.post<{ simulationId: number }>(`${this.baseUrl}/start`, dto);
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

    generateRecommendations(id: number): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/${id}/generate-recommendations`, {});
    }

    getResults(id: number): Observable<SimulationResultDto> {
        return this.http.get<SimulationResultDto>(`${this.baseUrl}/${id}`);
    }
}
