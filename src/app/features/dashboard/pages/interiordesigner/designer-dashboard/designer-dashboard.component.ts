import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DesignerProposalService } from '../../../../../core/services/designer-proposal.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './designer-dashboard.component.html',
  styleUrls: ['./designer-dashboard.component.css'],
})
export class DesignerDashboardComponent implements OnInit {

  overviewStats = [
    { label: 'Total Proposals', value: '0', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', bg: 'bg-white' },
    { label: 'Active Projects', value: '0', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', bg: 'bg-amber-100' },
    { label: 'Completed', value: '0', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', bg: 'bg-white' },
    { label: 'Overall Rating', value: '4.9', sub: '+12 reviews', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', bg: 'bg-white' },
  ];

  financials = [
    { label: 'Current Balance', value: '$14,850', main: true },
    { label: 'Pending', value: '$3,200', main: false },
    { label: 'Withdrawn', value: '$28,500', main: false },
  ];

  specializations: string[] = [
    'Modern',
    'Minimal',
    'Luxury',
    'Scandinavian',
    'Modern Design',
    'Luxury Interiors',
    'Sustainable Design'
  ];

  certifications: string[] = [
    'LEED Certified',
    'Best Interior Designer 2024',
    'AI Design Specialist',
    'NCIDQ Certified',
    'LEED AP'
  ];

  proposals: any[] = [];
  activeProjects: any[] = [];

  constructor(private proposalService: DesignerProposalService) { }

  ngOnInit() {
    this.loadProposals();
  }

  loadProposals() {
    this.proposalService.getMyProposals().subscribe({
      next: (data) => {

        this.proposals = data.map(p => ({
          id: p.id,
          title: p.title || `Project #${p.designRequestID}`,
          client: p.client || 'Unknown Client',
          price: `$${p.estimatedCost}`,
          status: p.status
        }));

        this.overviewStats[0].value = data.length.toString();

        // Dummy active projects (until backend provides designs)
        this.activeProjects = [
          { title: 'Luxury Penthouse', client: 'Omar Khalil', progress: 72, date: 'Dec 25, 2024' },
          { title: 'Beach House Design', client: 'Layla Ibrahim', progress: 40, date: 'Jan 10, 2025' }
        ];
      },
      error: (err) => console.error('Failed to load proposals', err)
    });
  }

  addSpecialization(input: HTMLInputElement) {
    if (input.value.trim()) {
      this.specializations.push(input.value.trim());
      input.value = '';
    }
  }

  removeSpecialization(index: number) {
    this.specializations.splice(index, 1);
  }

  addCertification(input: HTMLInputElement) {
    if (input.value.trim()) {
      this.certifications.push(input.value.trim());
      input.value = '';
    }
  }

  removeCertification(index: number) {
    this.certifications.splice(index, 1);
  }

  saveProfile() {
    console.log('Saving profile...', {
      specializations: this.specializations,
      certifications: this.certifications
    });
    // In a real app, you'd call a service here
    alert('Profile saved successfully!');
  }
}
