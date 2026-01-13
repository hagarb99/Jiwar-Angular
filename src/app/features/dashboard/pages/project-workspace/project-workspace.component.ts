import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subscription, Subject, takeUntil } from 'rxjs';

import { ChatService } from '../../../../core/services/chat.service';
import { AuthService } from '../../../../core/services/auth.service';
import { WorkspaceService } from '../../../../core/services/workspace.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { WorkspaceData } from '../../../../core/interfaces/workspace.interface';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { DialogModule } from 'primeng/dialog';
import { RatingModule } from 'primeng/rating';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';

interface ChatMessage {
    senderId: string;
    senderName: string;
    senderPhoto?: string;
    message?: string;
    messageText?: string;
    messageType?: number; // 0=Text, 1=Image, 2=PDF
    timestamp: Date;
    isMe: boolean;
}

@Component({
    selector: 'app-project-workspace',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ReactiveFormsModule,
        FormsModule,
        CardModule,
        ButtonModule,
        InputTextModule,
        AvatarModule,
        ScrollPanelModule,
        DialogModule,
        RatingModule,
        TextareaModule,
        ToastModule,
        TagModule
    ],
    templateUrl: './project-workspace.component.html',
    styleUrls: ['./project-workspace.component.css'],
    providers: [MessageService]
})
export class ProjectWorkspaceComponent implements OnInit, OnDestroy {
    // Workspace Data
    workspaceData: WorkspaceData | null = null;
    loading = true;

    // User Info
    currentUser: any;
    userRole: string = '';

    // Chat
    chatForm: FormGroup;
    messages: ChatMessage[] = [];
    messageSubscription!: Subscription;

    // Review Modal (Owner)
    showReviewModal: boolean = false;
    reviewForm: FormGroup;
    submittingReview = false;

    // Delivery
    deliveringProject = false;

    designRequestId: number = 0;
    contactName: string = '';
    contactPhoto: string = '';

    private destroy$ = new Subject<void>();

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private chatService: ChatService,
        private authService: AuthService,
        private workspaceService: WorkspaceService,
        private notificationService: NotificationService,
        private fb: FormBuilder,
        private messageService: MessageService
    ) {
        this.chatForm = this.fb.group({
            message: ['', Validators.required]
        });

        this.reviewForm = this.fb.group({
            rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
            comment: ['', [Validators.required, Validators.minLength(10)]]
        });
    }

    ngOnInit() {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        this.designRequestId = id;

        this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
            if (user) {
                this.currentUser = user;
                this.userRole = user.role;
                this.startChatConnection();
            }
        });

        this.loadWorkspaceData(id);

        // Listen for real-time notification refreshes
        this.notificationService.refresh$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                console.log('🔄 Real-time refresh triggered for Workspace');
                this.loadWorkspaceData(this.designRequestId, false);
            });
    }

    ngOnDestroy() {
        if (this.messageSubscription) {
            this.messageSubscription.unsubscribe();
        }
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadWorkspaceData(designRequestId: number, showLoading = true) {
        if (showLoading) this.loading = true;
        this.workspaceService.getWorkspaceData(designRequestId).pipe(takeUntil(this.destroy$)).subscribe({
            next: (data) => {
                const previouslyDelivered = this.workspaceData?.hasDelivered;
                this.workspaceData = data;
                this.loading = false;
                console.log('✅ Workspace data loaded:', data);

                // Backend auto-marks as read when fetching workspace
                // Just refresh the total unread count to update the badge
                this.chatService.getTotalUnreadCount().subscribe({
                    next: () => console.log('✅ Unread count refreshed after opening chat'),
                    error: (err) => console.error('❌ Failed to refresh unread count:', err)
                });

                // Load Chat History
                if (data.chatHistory) {
                    this.messages = data.chatHistory.map(m => ({
                        senderId: m.senderId,
                        senderName: m.senderName || (m.senderId === this.currentUser.id ? 'Me' : 'User'),
                        senderPhoto: m.senderPhoto,
                        message: m.messageText || m.message || '',
                        messageText: m.messageText || m.message || '',
                        messageType: m.messageType || 0,
                        timestamp: new Date(m.sentDate),
                        isMe: m.senderId === this.currentUser.id
                    }));
                    this.scrollToBottom();
                }

                // Set Contact Info for Header
                if (this.userRole === 'InteriorDesigner') {
                    // Designer is talking to Owner
                    this.contactName = data.designRequest?.userID === this.currentUser.id ? 'My Project' : 'Property Owner';

                    // Try to find the other user's photo from chat history
                    const otherUserMsg = data.chatHistory?.find(m => m.senderId !== this.currentUser.id);
                    this.contactPhoto = otherUserMsg?.senderPhoto || '';
                } else {
                    // Owner is talking to Designer
                    this.contactName = data.acceptedProposal?.designerName || 'Designer';

                    // Try to find the other user's photo from chat history
                    const otherUserMsg = data.chatHistory?.find(m => m.senderId !== this.currentUser.id);
                    this.contactPhoto = otherUserMsg?.senderPhoto || '';
                }

                // Join the chat room for this property
                if (data.designRequest?.propertyID) {
                    this.chatService.joinChatRoom(data.designRequest.propertyID);
                }

                // Auto-open review modal if:
                // 1. Explicitly requested via query param
                // 2. OR it just became delivered via real-time update and user is owner
                const justDelivered = !previouslyDelivered && data.hasDelivered;
                const shouldAutoOpen = (this.route.snapshot.queryParamMap.get('openReview') === 'true') ||
                    (justDelivered && this.userRole === 'PropertyOwner');

                if (shouldAutoOpen && !data.hasReviewed) {
                    setTimeout(() => this.openReviewModal(), 800);
                }
            },
            error: (err) => {
                console.error('❌ Failed to load workspace data:', err);
                if (showLoading) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to load project workspace'
                    });
                }
                this.loading = false;
            }
        });
    }

    startChatConnection() {
        const token = localStorage.getItem('token');
        if (token) {
            this.chatService.startConnection(token);

            // Clean up previous subscription if exists
            if (this.messageSubscription) {
                this.messageSubscription.unsubscribe();
            }

            // Listen for single new messages (Real-time)
            this.messageSubscription = this.chatService.messageReceived$.subscribe(m => {
                const propertyId = this.workspaceData?.designRequest.propertyID;

                // Only add if it belongs to this property and isn't a duplicate of what we just sent
                if (!propertyId || m.propertyId === propertyId) {
                    const newMessage: ChatMessage = {
                        senderId: m.senderId,
                        senderName: m.senderName || (m.senderId === this.currentUser.id ? 'Me' : 'User'),
                        senderPhoto: m.senderPhoto,
                        message: m.messageText || m.message || '',
                        messageText: m.messageText || m.message || '',
                        messageType: m.messageType || 0,
                        timestamp: m.sentDate ? new Date(m.sentDate) : new Date(),
                        isMe: m.senderId === this.currentUser.id
                    };

                    this.messages.push(newMessage);
                    this.scrollToBottom();
                }
            });
        }
    }

    sendMessage() {
        if (this.chatForm.invalid || !this.designRequestId) return;

        const msg = this.chatForm.get('message')?.value;
        if (!msg || !msg.trim()) return;

        const requestId = this.designRequestId;
        const senderId = this.currentUser?.id;

        // Optimistically add message to UI
        const newMessage: ChatMessage = {
            senderId: senderId,
            senderName: this.currentUser?.name || 'Me',
            senderPhoto: this.currentUser?.profilePicURL,
            message: msg,
            messageText: msg,
            messageType: 0,
            timestamp: new Date(),
            isMe: true
        };

        this.messages.push(newMessage);
        this.scrollToBottom();
        this.chatForm.reset();

        this.chatService.sendMessageViaApi(requestId, msg, senderId).subscribe({
            next: () => {
                console.log('✅ Message sent successfully');
                // Message already added
            },
            error: (err) => {
                console.error('❌ Failed to send message:', err);
                // Optionally remove the message or show error state
                this.messageService.add({
                    severity: 'error',
                    summary: 'Send Failed',
                    detail: 'Could not send message. Please try again.'
                });
            }
        });
    }

    @ViewChild('chatContainer') chatContainer!: ElementRef;

    scrollToBottom() {
        setTimeout(() => {
            if (this.chatContainer) {
                this.chatContainer.nativeElement.scrollTo({
                    top: this.chatContainer.nativeElement.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }, 100);
    }

    // --- Designer Actions ---
    deliverProject() {
        if (!this.workspaceData) return;

        this.deliveringProject = true;
        const proposalId = this.workspaceData.acceptedProposal.id;

        this.workspaceService.deliverProject(proposalId, 'Project completed successfully').subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Project Delivered!',
                    detail: 'The client has been notified. They will review your work soon.'
                });
                this.deliveringProject = false;

                // Reload workspace data to reflect new status
                this.loadWorkspaceData(this.workspaceData!.designRequest.id);
            },
            error: (err) => {
                console.error('❌ Delivery failed:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Delivery Failed',
                    detail: err.error?.message || 'Failed to deliver project'
                });
                this.deliveringProject = false;
            }
        });
    }

    goToSubmission() {
        // Navigate to upload-design with proposal context
        if (this.workspaceData) {
            this.router.navigate(['/dashboard/designer/upload-design'], {
                queryParams: { proposalId: this.workspaceData.acceptedProposal.id }
            });
        }
    }

    // --- Owner Actions ---
    openReviewModal() {
        if (!this.workspaceData?.hasDelivered) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Not Yet Delivered',
                detail: 'Please wait for the designer to deliver the project first.'
            });
            return;
        }

        if (this.workspaceData?.hasReviewed) {
            this.messageService.add({
                severity: 'info',
                summary: 'Already Reviewed',
                detail: 'You have already submitted a review for this project.'
            });
            return;
        }

        this.showReviewModal = true;
    }

    submitReview() {
        if (this.reviewForm.invalid || !this.workspaceData) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Invalid Form',
                detail: 'Please provide a rating and comment (minimum 10 characters)'
            });
            return;
        }

        this.submittingReview = true;
        const reviewData = {
            proposalId: this.workspaceData.acceptedProposal.id,
            designerId: this.workspaceData.acceptedProposal.designerId,
            propertyOwnerId: this.currentUser.id,
            rating: this.reviewForm.value.rating,
            comment: this.reviewForm.value.comment,
            designRequestId: this.workspaceData.designRequest.id
        };

        this.workspaceService.submitReview(reviewData).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Review Submitted!',
                    detail: 'Thank you for your feedback. The designer has been notified.'
                });
                this.showReviewModal = false;
                this.submittingReview = false;

                // Reload workspace to reflect hasReviewed = true
                this.loadWorkspaceData(this.workspaceData!.designRequest.id);
            },
            error: (err) => {
                console.error('❌ Review submission failed:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Submission Failed',
                    detail: err.error?.message || 'Failed to submit review'
                });
                this.submittingReview = false;
            }
        });
    }

    get projectName(): string {
        if (!this.workspaceData) return 'Loading...';
        return this.workspaceData.designRequest.preferredStyle
            ? `${this.workspaceData.designRequest.preferredStyle} Design`
            : `Project #${this.workspaceData.designRequest.id}`;
    }

    get isWorkspaceActive(): boolean {
        // Workspace is only active if there is an accepted proposal
        return !!this.workspaceData?.acceptedProposal;
    }

    get canChat(): boolean {
        // Designers can always chat (even if proposal not accepted yet)
        if (this.userRole === 'InteriorDesigner') return true;
        // Owners can only chat after accepting a proposal
        return this.isWorkspaceActive;
    }

    get projectStatus(): string {
        return this.workspaceData?.designRequest.status || 'Unknown';
    }

    get canDeliverProject(): boolean {
        return this.userRole === 'InteriorDesigner' &&
            this.workspaceData?.hasDelivered === false;
    }

    get canReview(): boolean {
        return this.userRole === 'PropertyOwner' &&
            this.workspaceData?.hasDelivered === true &&
            this.workspaceData?.hasReviewed === false;
    }

    get isProjectDelivered(): boolean {
        return this.workspaceData?.hasDelivered === true;
    }

    get isProjectReviewed(): boolean {
        return this.workspaceData?.hasReviewed === true;
    }

    trackByIndex(index: number, item: any): any {
        return index;
    }
}
