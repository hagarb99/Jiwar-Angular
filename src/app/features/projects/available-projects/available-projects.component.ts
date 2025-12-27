import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectCardComponent } from '../../../shared/components/project-card/project-card.component';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { DesignRequestService } from '../../../core/services/design-request.service';
import { DesignRequestDto } from '../../../core/models/design-request.dto';

@Component({
    selector: 'app-available-projects',
    standalone: true,
    imports: [CommonModule, ProjectCardComponent, SidebarComponent],
    templateUrl: './available-projects.component.html',
})
export class AvailableProjectsComponent implements OnInit {
    projects: any[] = [];

    constructor(private designRequestService: DesignRequestService) { }

    ngOnInit() {
        this.loadAvailableProjects();
    }

    loadAvailableProjects() {
        this.designRequestService.getAvailableDesignRequests().subscribe({
            next: (data) => {
                this.projects = data.map(req => ({
                    title: `Design Request #${req.id}`,
                    location: req.propertyAddress || 'Unknown Location',
                    description: req.notes || 'No description provided.',
                    postedTime: new Date(req.createdAt).toLocaleDateString(),
                    proposalsCount: 0,
                    propertyType: req.propertyType || 'Unknown Type',
                    size: 'N/A',
                    budget: req.budget ? `$${req.budget}` : 'Negotiable',
                    deadline: 'N/A',
                    style: req.preferredStyle
                }));
            },
            error: (err) => console.error('Failed to load projects', err)
        });
    }
}
