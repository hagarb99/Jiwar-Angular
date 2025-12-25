
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { RenovationApiService } from '../../services/renovation-api.service';
import { RenovationStateService } from '../../services/renovation-state.service';
import { SimulationGoalsDto } from '../../models/renovation.models';

@Component({
    selector: 'app-step4-goals',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, NavbarComponent, FooterComponent],
    templateUrl: './step4-goals.component.html'
})
export class Step4GoalsComponent {
    private fb = inject(FormBuilder);
    private api = inject(RenovationApiService);
    private state = inject(RenovationStateService);
    private router = inject(Router);

    isSubmitting = false;

    availableGoals = [
        { value: 'Increase Property Value', label: 'Increase Property Value', icon: 'pi pi-chart-line' },
        { value: 'Modernize & Update', label: 'Modernize & Update', icon: 'pi pi-star' },
        { value: 'Optimize Space', label: 'Optimize Space', icon: 'pi pi-th-large' },
        { value: 'Improve Energy Efficiency', label: 'Improve Energy Efficiency', icon: 'pi pi-bolt' },
        { value: 'Prepare for Rental', label: 'Prepare for Rental', icon: 'pi pi-user' },
        { value: 'Personal Comfort', label: 'Personal Comfort', icon: 'pi pi-inbox' }
    ];

    goalsForm = this.fb.group({
        goals: [[] as string[], [Validators.required, Validators.minLength(1)]],
        budgetMin: [null as number | null],
        budgetMax: [null as number | null],
        notes: [null as string | null]
    });

    isSelected(goal: string): boolean {
        const currentGoals = this.goalsForm.get('goals')?.value || [];
        return currentGoals.includes(goal);
    }

    toggleGoal(goal: string) {
        const currentGoals = this.goalsForm.get('goals')?.value || [];
        const index = currentGoals.indexOf(goal);

        let newGoals: string[];
        if (index > -1) {
            newGoals = currentGoals.filter(g => g !== goal);
        } else {
            newGoals = [...currentGoals, goal];
        }

        this.goalsForm.patchValue({ goals: newGoals });
        this.goalsForm.get('goals')?.markAsTouched();
    }

    onBudgetChange(event: Event) {
        const val = (event.target as HTMLSelectElement).value;
        if (!val || val === 'null' || val === 'Select budget') {
            this.goalsForm.patchValue({ budgetMin: null, budgetMax: null });
        } else {
            const [min, max] = val.split('-').map(Number);
            this.goalsForm.patchValue({ budgetMin: min, budgetMax: max });
        }
    }

    onSubmit() {
        if (this.goalsForm.invalid) return;

        this.isSubmitting = true;
        const simulationId = this.state.getSimulationIdOrThrow();
        const val = this.goalsForm.value;

        const dto: SimulationGoalsDto = {
            goals: val.goals!,
            budgetMin: val.budgetMin || undefined,
            budgetMax: val.budgetMax || undefined,
            notes: val.notes || undefined
        };

        // 1. Set Goals
        this.api.setGoals(simulationId, dto).subscribe({
            next: () => {
                // 2. Complete Simulation
                this.api.completeSimulation(simulationId).subscribe({
                    next: () => {
                        this.router.navigate(['/renovation/results']);
                    },
                    error: (err) => {
                        console.error('Error completing simulation', err);
                        this.isSubmitting = false;
                    }
                });
            },
            error: (err) => {
                console.error('Error setting goals', err);
                this.isSubmitting = false;
            }
        });
    }
}
