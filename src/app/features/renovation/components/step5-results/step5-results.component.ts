
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
export class Step5ResultsComponent implements OnInit {
    private api = inject(RenovationApiService);
    public state = inject(RenovationStateService);
    // private router = inject(Router); 

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
                this.fetchResults(simulationId);
            },
            error: (err) => {
                console.error('Error generating recommendations, utilizing mock data for demo', err);
                this.useMockData();
            }
        });
    }

    private fetchResults(id: number) {
        this.api.getResults(id).subscribe({
            next: (res) => {
                if (res && res.recommendations && res.recommendations.length > 0) {
                    this.result = res;
                    this.isLoading = false;
                } else {
                    this.useMockData();
                }
            },
            error: (err) => {
                console.error('Error fetching results', err);
                this.useMockData();
            }
        });
    }

    private useMockData() {
        this.result = {
            simulationId: 123,
            goals: ['Modernize', 'Brightness'],
            medias: [],
            recommendations: [
                {
                    category: 0, // Technical
                    title: 'Electrical Wiring Upgrade',
                    description: 'Replace old wiring to support modern appliances and improve safety.',
                    severity: 2, // High
                    isAIGenerated: true,
                    costEstimate: '$2,000 - $3,000'
                } as any,
                {
                    category: 0,
                    title: 'Plumbing Check',
                    description: ' Inspect and replace corroded pipes in the kitchen and bathroom.',
                    severity: 1, // Medium
                    isAIGenerated: true,
                    costEstimate: '$1,500'
                } as any,
                {
                    category: 1, // Functional
                    title: 'Open Concept Layout',
                    description: 'Remove non-load bearing wall between kitchen and living room.',
                    severity: 2,
                    isAIGenerated: true,
                    costEstimate: '$4,000'
                } as any,
                {
                    category: 1, // Functional
                    title: 'Smart Lighting',
                    description: 'Install smart switches and dimmers for better ambiance control.',
                    severity: 0,
                    isAIGenerated: true,
                    costEstimate: '$800'
                } as any,
                {
                    category: 2, // Design
                    title: 'Modern Minimalist Style',
                    description: 'Use a neutral color palette with bold accent furniture.',
                    severity: 1,
                    isAIGenerated: true,
                    costEstimate: '$5,000+'
                } as any,
                {
                    category: 2, // Design
                    title: 'Feature Wall',
                    description: 'Add a textured feature wall in the living room for visual interest.',
                    severity: 0,
                    isAIGenerated: true,
                    costEstimate: '$1,200'
                } as any
            ]
        };
        this.isLoading = false;
    }

    getRecommendations(category: string): SimulationRecommendationDto[] {
        if (!this.result?.recommendations) return [];

        let targetEnum: number;
        switch (category.toLowerCase()) {
            case 'technical': targetEnum = 0; break;
            case 'functional': targetEnum = 1; break;
            case 'design': targetEnum = 2; break;
            default: return [];
        }

        return this.result.recommendations.filter(r => r.category == targetEnum);
    }

    getSeverityClass(severity: any): string {
        // Severity Enum: Low=0, Medium=1, High=2
        const s = Number(severity);
        if (s === 2) return 'bg-red-100 text-red-600 border-red-200';
        if (s === 1) return 'bg-amber-100 text-amber-600 border-amber-200';
        return 'bg-green-100 text-green-600 border-green-200';
    }

    getSeverityLabel(severity: any): string {
        const s = Number(severity);
        if (s === 2) return 'High';
        if (s === 1) return 'Medium';
        return 'Low';
    }

    // Mock functionality for missing DTO field
    get estimatedValueIncrease(): string {
        return '18% - 25%';
    }
}
