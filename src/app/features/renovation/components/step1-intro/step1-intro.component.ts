
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { RenovationApiService } from '../../services/renovation-api.service';
import { RenovationStateService } from '../../services/renovation-state.service';
import { AuthService } from '../../../../core/services/auth.service';
import { StartSimulationDto, Property, SimulationSourceEnum } from '../../models/renovation.models';

@Component({
    selector: 'app-step1-intro',
    standalone: true,
    imports: [CommonModule, RouterModule, NavbarComponent, FooterComponent],
    templateUrl: './step1-intro.component.html'
})
export class Step1IntroComponent {
    private api = inject(RenovationApiService);
    private state = inject(RenovationStateService);
    private auth = inject(AuthService);
    private router = inject(Router);

    isLoading = false;
    propertyExists: boolean | null = null;
    myProperties: Property[] = [];
    selectedPropertyId: number | null = null;
    isLoadingProperties = false;

    setExists(exists: boolean) {
        this.propertyExists = exists;
        if (exists && this.myProperties.length === 0) {
            this.fetchProperties();
        }
    }

    /*ngOnInit() {
        this.fetchProperties();
    }*/

    fetchProperties() {
        this.isLoadingProperties = true;
        this.api.getUserProperties().subscribe({
            next: (props) => {
                this.myProperties = props;
                this.isLoadingProperties = false;
            },
            error: (err) => {
                console.error('Failed to fetch properties', err);
                this.isLoadingProperties = false;
            }
        });
        
    }

    selectProperty(id: number) {
        this.selectedPropertyId = id;
    }

    startSimulation() {
        if (!this.auth.isLoggedIn()) {
            this.router.navigate(['/login']);
            return;
        }

        if (this.propertyExists === true && !this.selectedPropertyId) {
            return;
        }

        this.isLoading = true;

        const propertyId = this.propertyExists ? this.selectedPropertyId! : undefined;
        this.state.setPropertyId(propertyId || 0);
        this.state.setIsExistingProperty(!!propertyId);

        const dto: StartSimulationDto = {
            PropertyID: propertyId,
            BudgetMin: 0,
            BudgetMax: 0,
            GoalsJson: []
        };

        this.api.startSimulation(dto).subscribe({
            next: (res: any) => {
                // Handle various response formats (camelCase, PascalCase, or raw number)
                const simulationId = res?.simulationId || res?.SimulationId || res?.id || res?.Id || (typeof res === 'number' ? res : null);

                if (simulationId) {
                    this.state.setSimulationId(simulationId);
                    this.isLoading = false;

                    if (this.state.isExistingProperty()) {
                        this.router.navigate(['/renovation/goals']);
                    } else {
                        this.router.navigate(['/renovation/details']);
                    }
                } else {
                    console.error('Invalid simulation ID received', res);
                    alert('Simulation could not start: Invalid ID received.');
                    this.isLoading = false;
                }
            },
            error: (err) => {
                console.error('Failed to start simulation', err);
                const backendMessage = err?.error || err?.message || 'Unknown error';
                alert(`Failed to start simulation: ${backendMessage}`);
                this.isLoading = false;
            }
        });

    }

}
