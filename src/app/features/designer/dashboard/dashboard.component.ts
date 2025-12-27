import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';

// Services
import { DesignRequestService } from '../../../core/services/design-request.service';
import { DesignerProposalService } from '../../../core/services/designer-proposal.service';


// Interfaces
import { DesignRequest } from '../../../core/interfaces/design-request.interface';
import { DesignerProposal } from '../../../core/interfaces/designer-proposal.interface';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, SidebarComponent],
    templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {

    overviewStats = [
        { label: 'Total Proposals', value: '0', sub: '' },
        { label: 'Active Projects', value: '0' },
        { label: 'Available Requests', value: '0' },
        { label: 'Overall Rating', value: '4.9', sub: '+12 reviews' },
    ];

    financials = [
        { label: 'Current Balance', value: '$0', main: true },
        { label: 'Pending', value: '$0', main: false },
        { label: 'Withdrawn', value: '$0', main: false },
    ];

    availableRequests: DesignRequest[] = [];
    proposals: any[] = []; // UI Model
    activeProjects: any[] = [];

    loadingRequests = false;
    loadingProposals = false;

    constructor(
        private designRequestService: DesignRequestService,
        private designerProposalService: DesignerProposalService
    ) { }

    ngOnInit(): void {
        this.loadMyProposals();
        this.loadAvailableRequests();
    }

    /** ---------- Load Available Requests ---------- */
    loadAvailableRequests(): void {
        this.loadingRequests = true;

        this.designRequestService.getAvailableDesignRequests()
            .subscribe({
                next: (res) => {
                    this.availableRequests = res;
                    this.overviewStats[2].value = res.length.toString();
                    this.loadingRequests = false;
                },
                error: () => this.loadingRequests = false
            });
    }

    /** ---------- Load My Proposals ---------- */
    loadMyProposals(): void {
        this.loadingProposals = true;

        this.designerProposalService.getMyProposals()
            .subscribe({
                next: (res) => {
                    // Map to UI model for the 'My Proposals' list in template
                    this.proposals = res.map(p => ({
                        ...p,
                        title: p.title || `Request #${p.designRequestID}`,
                        client: p.client || `Client`,
                        price: `$${p.estimatedCost}`,
                        status: p.status || 'Sent'
                    }));

                    // We can also derive Active Projects list locally for specific UI table even if stats come from dashboard endpoint
                    this.activeProjects = res
                        .filter(p => p.status === 'Accepted' || p.status === 'In Progress')
                        .map(p => ({
                            title: p.title || `Request #${p.designRequestID}`,
                            client: p.client || 'Client',
                            progress: 0,
                            date: 'Started'
                        }));

                    this.loadingProposals = false;
                },
                error: () => this.loadingProposals = false
            });
    }
}
