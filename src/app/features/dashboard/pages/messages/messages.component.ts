import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { DesignRequestService } from '../../../../core/services/design-request.service';
import { DesignerProposalService } from '../../../../core/services/designer-proposal.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';

@Component({
    selector: 'app-messages',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        CardModule,
        ButtonModule,
        AvatarModule,
        TagModule
    ],
    templateUrl: './messages.component.html',
    styles: [`
    .message-card {
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .message-card:hover {
      background-color: #f8fafc;
      transform: translateY(-2px);
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    }
  `]
})
export class MessagesComponent implements OnInit {
    conversations: any[] = [];
    loading = true;
    currentUserRole: string | null = null;

    constructor(
        private router: Router,
        private authService: AuthService,
        private designRequestService: DesignRequestService,
        private proposalService: DesignerProposalService
    ) { }

    ngOnInit() {
        this.authService.currentUser$.subscribe(user => {
            if (user) {
                this.currentUserRole = user.role;
                this.loadConversations();
            }
        });
    }

    loadConversations() {
        this.loading = true;

        // Strategy: Use existing service calls but map new fields if available (lastMessage, unreadCount)
        // This makes the "Conversations Page" fully functional without needing a new untested service method right now.

        if (this.currentUserRole === 'PropertyOwner') {
            this.designRequestService.getMyDesignRequests().subscribe({
                next: (requests) => {
                    this.conversations = requests
                        .filter(r => r.status !== 'Pending' && r.status !== 'New')
                        .map(r => ({
                            id: r.id,
                            title: r.preferredStyle ? `${r.preferredStyle} Design` : `Project #${r.id}`,
                            subtitle: (r as any).lastMessage || `Status: ${r.status}`,
                            image: null,
                            time: r.createdAt ? new Date(r.createdAt) : new Date(),
                            type: 'request',
                            unread: (r as any).unreadCount || 0
                        }))
                        .sort((a, b) => b.time.getTime() - a.time.getTime());
                    this.loading = false;
                },
                error: (err) => {
                    console.error('Failed to load requests', err);
                    this.loading = false;
                }
            });
        } else if (this.currentUserRole === 'InteriorDesigner') {
            this.proposalService.getMyProposals().subscribe({
                next: (proposals) => {
                    console.log('Messages Page - Raw Proposals:', proposals);
                    this.conversations = proposals
                        .filter(p => p.status === 1 || p.status === 3) // Accepted or Delivered
                        .map(p => {
                            // Robust ID check
                            const requestId = p.designRequestID || (p as any).designRequestId || (p as any).requestId;

                            return {
                                id: requestId, // IMPORTANT: Navigate to Request ID
                                title: `Project #${requestId}`,
                                subtitle: (p as any).lastMessage || p.proposalDescription || 'Active Project',
                                image: p.sampleDesignURL,
                                time: new Date(), // TODO: Fetch last message time if available
                                type: 'proposal',
                                unread: (p as any).unreadCount || 0
                            };
                        });
                    this.loading = false;
                },
                error: (err) => {
                    console.error('Failed to load proposals', err);
                    this.loading = false;
                }
            });
        } else {
            this.loading = false;
        }
    }

    openChat(id: number) {
        if (id) {
            this.router.navigate(['/dashboard/workspace', id]);
        } else {
            console.error('Cannot navigate: ID is missing');
        }
    }
}
