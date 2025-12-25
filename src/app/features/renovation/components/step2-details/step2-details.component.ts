
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RenovationApiService } from '../../services/renovation-api.service';
import { RenovationStateService } from '../../services/renovation-state.service';
import { UpdateSimulationDetailsDto } from '../../models/renovation.models';

@Component({
    selector: 'app-step2-details',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './step2-details.component.html'
})
export class Step2DetailsComponent {
    private fb = inject(FormBuilder);
    private api = inject(RenovationApiService);
    private state = inject(RenovationStateService);
    private router = inject(Router);

    isSubmitting = false;

    detailsForm = this.fb.group({
        propertyType: [null], // Not in DTO but needed for UI state if we want to persist it locally
        size: [null as number | null, [Validators.required, Validators.min(1)]],
        rooms: [null as number | null, [Validators.required]],
        bathrooms: [null as number | null, [Validators.required]],
        condition: [null as string | null, [Validators.required]],
        yearBuilt: [null as number | null]
    });

    onSubmit() {
        if (this.detailsForm.invalid) return;

        this.isSubmitting = true;
        const simulationId = this.state.getSimulationIdOrThrow();

        const val = this.detailsForm.value;

        const dto: UpdateSimulationDetailsDto = {
            size: val.size!,
            rooms: val.rooms!,
            bathrooms: val.bathrooms!,
            condition: val.condition!,
            yearBuilt: val.yearBuilt || undefined
        };

        this.api.updateDetails(simulationId, dto).subscribe({
            next: () => {
                this.isSubmitting = false;
                this.router.navigate(['/renovation/media']);
            },
            error: (err) => {
                console.error('Error updating details', err);
                this.isSubmitting = false;
            }
        });
    }
}
