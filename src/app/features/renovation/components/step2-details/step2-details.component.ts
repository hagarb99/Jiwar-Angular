
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { RenovationApiService } from '../../services/renovation-api.service';
import { RenovationStateService } from '../../services/renovation-state.service';
import { UpdateSimulationDetailsDto } from '../../models/renovation.models';

@Component({
    selector: 'app-step2-details',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, NavbarComponent, FooterComponent],
    templateUrl: './step2-details.component.html'
})
export class Step2DetailsComponent implements OnInit {
    private fb = inject(FormBuilder);
    private api = inject(RenovationApiService);
    public state = inject(RenovationStateService);
    private router = inject(Router);

    isSubmitting = false;

    ngOnInit() {
        if (this.state.isExistingProperty()) {
            this.router.navigate(['/renovation/goals']);
        }
    }

    detailsForm = this.fb.group({
        propertyType: [null],
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

    adjustCount(controlName: string, delta: number) {
        const control = this.detailsForm.get(controlName);
        if (control) {
            const currentVal = (control.value as number) || 0;
            const newVal = Math.max(0, currentVal + delta);
            control.setValue(newVal);
            control.markAsTouched();
        }
    }
}
