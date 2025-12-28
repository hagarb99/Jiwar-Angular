import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectCardComponent } from '../../../shared/components/project-card/project-card.component';
import { SidebarComponent } from '../../dashboard/sidebar/sidebar.component';

@Component({
    selector: 'app-available-projects',
    standalone: true,
    imports: [CommonModule, ProjectCardComponent, SidebarComponent],
    templateUrl: './available-projects.component.html',
})
export class AvailableProjectsComponent {
    projects = [
        {
            title: 'Modern Apartment Renovation',
            location: 'New Cairo',
            description: 'Looking for a complete interior redesign of a 3-bedroom apartment with focus on open-plan living and smart storage solutions.',
            postedTime: '2 days ago',
            proposalsCount: 5,
            propertyType: 'Apartment',
            size: '150 sqm',
            budget: '$10,000 - $15,000',
            deadline: 'Jan 15, 2025',
            style: 'Modern'
        },
        {
            title: 'Luxury Villa Interior Design',
            location: '6th October',
            description: 'Complete interior design for a new villa including furniture selection and custom pieces. Emphasis on premium materials.',
            postedTime: '1 day ago',
            proposalsCount: 8,
            propertyType: 'Villa',
            size: '400 sqm',
            budget: '$50,000 - $80,000',
            deadline: 'Feb 1, 2025',
            style: 'Luxury'
        },
        {
            title: 'Office Space Redesign',
            location: 'Downtown Cairo',
            description: 'Open-plan office redesign for a tech startup, focusing on collaborative spaces and modern aesthetics.',
            postedTime: '3 days ago',
            proposalsCount: 3,
            propertyType: 'Commercial',
            size: '200 sqm',
            budget: '$15,000 - $25,000',
            deadline: 'Jan 20, 2025',
            style: 'Minimalist'
        },
        {
            title: 'Classic Bedroom Suite',
            location: 'Maadi',
            description: 'Master bedroom and ensuite bathroom renovation with classic Egyptian-inspired design elements.',
            postedTime: '5 days ago',
            proposalsCount: 12,
            propertyType: 'Apartment',
            size: '45 sqm',
            budget: '$5,000 - $8,000',
            deadline: 'Jan 10, 2025',
            style: 'Classic'
        },
        {
            title: 'Restaurant Interior Concept',
            location: 'Zamalek',
            description: 'Industrial-style restaurant interior with exposed brick, metal fixtures, and cozy dining areas.',
            postedTime: '1 week ago',
            proposalsCount: 6,
            propertyType: 'Commercial',
            size: '180 sqm',
            budget: '$30,000 - $45,000',
            deadline: 'Feb 15, 2025',
            style: 'Industrial'
        }
    ];
}
