
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { RenovationApiService } from '../../services/renovation-api.service';
import { RenovationStateService } from '../../services/renovation-state.service';
import { StartSimulationDto } from '../../models/renovation.models';

@Component({
    selector: 'app-step1-intro',
    standalone: true,
    imports: [CommonModule, RouterModule, NavbarComponent, FooterComponent],
    templateUrl: './step1-intro.component.html'
})
export class Step1IntroComponent {
    private api = inject(RenovationApiService);
    private state = inject(RenovationStateService);
    private router = inject(Router);

    isLoading = false;

    startSimulation() {
        this.isLoading = true;

        // In a real app, propertyId might come from a selected listing or user context.
        // For now, we use a default or the state's value if set (e.g., passed via query params in a guard).
        const propertyId = this.state.propertyId() || 101;

        const dto: StartSimulationDto = { propertyId };

        this.api.startSimulation(dto).subscribe({
            next: (res) => {
                this.state.setSimulationId(res.simulationId);
                this.isLoading = false;
                this.router.navigate(['/renovation/details']);
            },
            error: (err) => {
                console.error('Failed to start simulation', err);
                this.isLoading = false;
                // Optionally show toast error here
            }
        });
    }
}
