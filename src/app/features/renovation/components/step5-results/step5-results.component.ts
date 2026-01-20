import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { RenovationApiService } from '../../services/renovation-api.service';
import { RenovationStateService } from '../../services/renovation-state.service';
import { SimulationResultDto, SimulationRecommendationDto } from '../../models/renovation.models';

@Component({
    selector: 'app-step5-results',
    standalone: true,
    imports: [CommonModule, RouterModule, NavbarComponent, FooterComponent],
    templateUrl: './step5-results.component.html'
})
export class Step5ResultsComponent implements OnInit, OnDestroy {

    private api = inject(RenovationApiService);
    public state = inject(RenovationStateService);

    isLoading = true;
    result: SimulationResultDto | null = null;

    private retryTimer: any;
    private readonly RETRY_DELAY = 1500; // ms

    ngOnInit(): void {
        const simulationId = this.state.getSimulationIdOrThrow();

        this.api.generateRecommendations(simulationId).subscribe({
            next: () => {
                this.fetchResults(simulationId);
            },
            error: err => {
                console.error('AI generation failed', err);
                this.fetchResults(simulationId); // fallback
            }
        });

    }

    ngOnDestroy(): void {
        if (this.retryTimer) {
            clearTimeout(this.retryTimer);
        }
    }

    private fetchResults(simulationId: number): void {
        this.api.getResults(simulationId).subscribe({
            next: (res) => {
                if (res?.recommendations?.length) {
                    this.result = res;

                    this.isLoading = false;
                } else {
                    // AI لسه بيشتغل → استنى وجرب تاني
                    this.retryTimer = setTimeout(
                        () => this.fetchResults(simulationId),
                        this.RETRY_DELAY
                    );
                }
            },
            error: (err) => {
                console.error('Error fetching results', err);

                if (err.status === 401) {
                    this.isLoading = false;
                    return; // ❌ ممنوع retry
                }

                this.retryTimer = setTimeout(
                    () => this.fetchResults(simulationId),
                    this.RETRY_DELAY
                );
            }

        });
    }

    // ===============================
    // Helpers
    // ===============================

    getRecommendations(category: 'Technical' | 'Functional' | 'Design') {
        if (!this.result?.recommendations) return [];

        return this.result.recommendations.filter(
            r => r.category === category
        );
    }



    getSeverityClass(severity: number): string {
        switch (severity) {
            case 2:
                return 'bg-red-100 text-red-600 border-red-200';
            case 1:
                return 'bg-amber-100 text-amber-600 border-amber-200';
            default:
                return 'bg-green-100 text-green-600 border-green-200';
        }
    }

    getSeverityLabel(severity: number): string {
        switch (severity) {
            case 2: return 'High';
            case 1: return 'Medium';
            default: return 'Low';
        }
    }

    get estimatedValueIncrease(): string {
        return '18% - 25%';
    }
}
