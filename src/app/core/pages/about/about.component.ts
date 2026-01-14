import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Shield, Users, Target, Award, Rocket, CheckCircle } from 'lucide-angular';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';

@Component({
    selector: 'app-about',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, NavbarComponent, FooterComponent],
    templateUrl: './about.component.html',
    styleUrl: './about.component.css'
})
export class AboutComponent {
    readonly Shield = Shield;
    readonly Users = Users;
    readonly Target = Target;
    readonly Award = Award;
    readonly Rocket = Rocket;
    readonly CheckCircle = CheckCircle;

    stats = [
        { label: 'Happy Clients', value: '10k+' },
        { label: 'Properties Sold', value: '5k+' },
        { label: 'Expert Agents', value: '200+' },
        { label: 'Awards Won', value: '15' }
    ];

    team = [
        {
            name: 'Ahmed Mansour',
            role: 'Founder & CEO',
            image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800'
        },
        {
            name: 'Sarah Chen',
            role: 'Head of AI Strategy',
            image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800'
        },
        {
            name: 'Michael Miller',
            role: 'Real Estate Director',
            image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=800'
        }
    ];
}
