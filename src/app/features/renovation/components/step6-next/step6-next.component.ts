
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { RenovationStateService } from '../../services/renovation-state.service';

@Component({
    selector: 'app-step6-next',
    standalone: true,
    imports: [CommonModule, RouterModule, NavbarComponent, FooterComponent],
    templateUrl: './step6-next.component.html'
})
export class Step6NextComponent {
    private state = inject(RenovationStateService);
    private router = inject(Router);

    onHireDesigner() {
        console.log('Navigating to Designer Marketplace...');
        this.router.navigate(['/designers']);
    }

    onPostRequest() {
        console.log('Opening Post Request Form...');
        // this.router.navigate(['/design-request']); // Placeholder
        alert('Post Design Request feature coming soon!');
    }

    onOpenAIAssistant() {
        console.log('Opening AI Assistant...');
        this.router.navigate(['/renovation/chat']);
    }

    restart() {
        this.state.clearState();
        this.router.navigate(['/renovation/intro']);
    }
}
