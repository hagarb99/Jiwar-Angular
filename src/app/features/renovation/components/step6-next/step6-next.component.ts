
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { RenovationStateService } from '../../services/renovation-state.service';

@Component({
    selector: 'app-step6-next',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './step6-next.component.html'
})
export class Step6NextComponent {
    private state = inject(RenovationStateService);
    private router = inject(Router);

    restart() {
        this.state.clearState();
        this.router.navigate(['/renovation/intro']);
    }
}
