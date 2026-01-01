
import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class RenovationStateService {
    // Using Angular Signals for modern state management
    readonly simulationId = signal<number | null>(null);
    readonly propertyId = signal<number>(0);
    readonly isExistingProperty = signal<boolean>(false);

    setSimulationId(id: number) {
        this.simulationId.set(id);
    }

    setPropertyId(id: number) {
        this.propertyId.set(id);
    }

    setIsExistingProperty(value: boolean) {
        this.isExistingProperty.set(value);
    }

    getSimulationIdOrThrow(): number {
        const id = this.simulationId();
        if (!id) {
            throw new Error('Simulation ID not set. Flow interrupted.');
        }
        return id;
    }

    clearState() {
        this.simulationId.set(null);
        this.propertyId.set(0);
        this.isExistingProperty.set(false);
    }
}
