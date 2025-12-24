
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { RenovationApiService } from '../../services/renovation-api.service';
import { RenovationStateService } from '../../services/renovation-state.service';
import { SimulationResultDto, SimulationRecommendationDto } from '../../models/renovation.models';

@Component({
    selector: 'app-step5-results',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './step5-results.component.html'
})
export class Step5ResultsComponent implements OnInit {
    private api = inject(RenovationApiService);
    private state = inject(RenovationStateService);
    // private router = inject(Router); // Not used in TS, used in HTML routerLink

    isLoading = true;
    result: SimulationResultDto | null = null;

    ngOnInit() {
        this.loadResults();
    }

    loadResults() {
        const simulationId = this.state.getSimulationIdOrThrow();

        // 1. Trigger AI Generation
        this.api.generateRecommendations(simulationId).subscribe({
            next: () => {
                // 2. Fetch Results
                this.api.getResults(simulationId).subscribe({
                    next: (res) => {
                        this.result = res;
                        this.isLoading = false;
                    },
                    error: (err) => {
                        console.error('Error fetching results', err);
                        this.isLoading = false;
                    }
                });
            },
            error: (err) => {
                console.error('Error generating recommendations', err);
                this.isLoading = false;
            }
        });
    }

    getRecommendations(category: string): SimulationRecommendationDto[] {
        if (!this.result?.recommendations) return [];
        // Handle Case Insensitive comparison just in case
        return this.result.recommendations.filter(r =>
            String(r.category).toLowerCase() === category.toLowerCase()
        );
    }

    getSeverityClass(severity: any): string {
        const sev = String(severity).toLowerCase(); // Handle enum or string
        if (sev === 'high' || sev === '2') return 'bg-red-100 text-red-600';
        if (sev === 'medium' || sev === '1') return 'bg-amber-100 text-amber-600';
        return 'bg-green-100 text-green-600'; // Low
    }
}
