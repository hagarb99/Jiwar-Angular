import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-project-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './project-card.component.html',
})
export class ProjectCardComponent {
    @Input() project: any;
}
