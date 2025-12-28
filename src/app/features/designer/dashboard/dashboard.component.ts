import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../../core/services/auth.service';

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
        { label: 'Total Proposals', value: '0', sub: '', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', bg: 'bg-white' },
        { label: 'Active Projects', value: '0', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', bg: 'bg-amber-100' },
        { label: 'Available Requests', value: '0', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', bg: 'bg-white' },
        { label: 'Overall Rating', value: '4.9', sub: '+12 reviews', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', bg: 'bg-white' },
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

    currentUser: any;

    constructor(
        private designRequestService: DesignRequestService,
        private designerProposalService: DesignerProposalService,
        private authService: AuthService
    ) { }

    userRole: string | null = null;

    ngOnInit(): void {
        this.currentUser = this.authService.getUserName();
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            this.userRole = JSON.parse(storedUser).role;
        }

        if (this.userRole === 'InteriorDesigner') {
            this.loadMyProposals();
            this.loadAvailableRequests();
        } else {
            // Owner/Customer logic
            // For now, let's load THEIR requests instead of "available" ones
            this.loadMyRequests();
        }
    }

    /** ---------- Load My Requests (For Owners) ---------- */
    loadMyRequests(): void {
        this.loadingRequests = true;
        this.designRequestService.getMyDesignRequests().subscribe({
            next: (res) => {
                // Map to show in "Active Projects" or similar UI
                this.activeProjects = res.map(r => ({
                    title: `Request #${r.id}`,
                    client: 'Me',
                    progress: r.status === 'Completed' ? 100 : 0,
                    date: new Date(r.createdAt).toLocaleDateString()
                }));
                this.overviewStats[1].value = res.length.toString(); // Reuse Active Projects stat
                this.loadingRequests = false;
            },
            error: () => this.loadingRequests = false
        });
    }

    /** ---------- Load Available Requests (For Designers) ---------- */
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
                        status: p.status || 'Pending' // Default to pending if null
                    }));

                    // Update "Total Proposals" Stat
                    this.overviewStats[0].value = res.length.toString();

                    // We can also derive Active Projects list locally for specific UI table even if stats come from dashboard endpoint
                    const active = res.filter(p => p.status === 'Accepted' || p.status === 'In Progress');
                    this.activeProjects = active.map(p => ({
                        title: p.title || `Request #${p.designRequestID}`,
                        client: p.client || 'Client',
                        progress: 0,
                        date: 'Started'
                    }));

                    // Update "Active Projects" Stat
                    this.overviewStats[1].value = active.length.toString();

                    this.loadingProposals = false;
                },
                error: () => this.loadingProposals = false
            });
    }
}
