import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../dashboard/sidebar/sidebar.component';

@Component({
    selector: 'app-profile-editing',
    standalone: true,
    imports: [CommonModule, SidebarComponent],
    templateUrl: './profile-editing.component.html',
})
export class ProfileEditingComponent {
    specializations = ['Luxury Residential', 'Modern Minimalist', 'Commercial Spaces', 'Renovation'];
    certifications = ['NCIDQ Certified', 'LEED AP', 'ASID Member'];
}
