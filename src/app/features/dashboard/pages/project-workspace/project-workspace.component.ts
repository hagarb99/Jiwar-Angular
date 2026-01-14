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
    isRead?: boolean;
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

                // Handle Robust Data Mapping (camelCase vs PascalCase)
                const rawData = data as any;
                const designRequest = rawData.designRequest || rawData.DesignRequest;
                const acceptedProposal = rawData.acceptedProposal || rawData.AcceptedProposal;
                const chatHistory = rawData.chatHistory || rawData.ChatHistory || [];

                // Ensure we have a clean WorkspaceData object with expected camelCase properties
                this.workspaceData = {
                    designRequest: {
                        id: designRequest?.id || designRequest?.Id,
                        title: designRequest?.title || designRequest?.Title,
                        status: designRequest?.status || designRequest?.Status,
                        preferredStyle: designRequest?.preferredStyle || designRequest?.PreferredStyle,
                        budget: designRequest?.budget || designRequest?.Budget,
                        notes: designRequest?.notes || designRequest?.Notes,
                        propertyID: designRequest?.propertyID || designRequest?.PropertyID || designRequest?.propertyId || designRequest?.PropertyId,
                        userID: designRequest?.userID || designRequest?.UserID || designRequest?.userId || designRequest?.UserId
                    },
                    acceptedProposal: acceptedProposal ? {
                        id: acceptedProposal.id || acceptedProposal.Id,
                        designerId: acceptedProposal.designerId || acceptedProposal.DesignerId,
                        designerName: acceptedProposal.designerName || acceptedProposal.DesignerName,
                        estimatedCost: acceptedProposal.estimatedCost || acceptedProposal.EstimatedCost,
                        estimatedDays: acceptedProposal.estimatedDays || acceptedProposal.EstimatedDays,
                        status: acceptedProposal.status || acceptedProposal.Status,
                        deliveredAt: acceptedProposal.deliveredAt || acceptedProposal.DeliveredAt,
                        proposalDescription: acceptedProposal.proposalDescription || acceptedProposal.ProposalDescription
                    } : (null as any),
                    hasDelivered: rawData.hasDelivered ?? rawData.HasDelivered ?? false,
                    hasReviewed: rawData.hasReviewed ?? rawData.HasReviewed ?? false,
                    chatHistory: chatHistory
                };

                this.loading = false;
                console.log('✅ Workspace data loaded (Robust):', this.workspaceData);
                console.log(`📜 Found ${chatHistory.length} messages in API response`);

                // Backend auto-marks as read when fetching workspace
                // Wait a bit to ensure the backend completes the mark-as-read operation
                setTimeout(() => {
                    this.chatService.getTotalUnreadCount().subscribe({
                        next: () => console.log('✅ Unread count refreshed after opening chat'),
                        error: (err) => console.error('❌ Failed to refresh unread count:', err)
                    });
                }, 500);

                // Load Chat History
                if (chatHistory && chatHistory.length > 0) {
                    this.messages = chatHistory.map((m: any) => ({
                        senderId: m.senderId || m.SenderId || m.senderID || m.SenderID,
                        senderName: m.senderName || m.SenderName || ((m.senderId || m.SenderId || m.senderID || m.SenderID) === this.currentUser.id ? 'Me' : 'User'),
                        senderPhoto: m.senderPhoto || m.SenderPhoto,
                        message: m.messageText || m.MessageText || m.message || m.Message || '',
                        messageText: m.messageText || m.MessageText || m.message || m.Message || '',
                        messageType: m.messageType ?? m.MessageType ?? 0,
                        timestamp: new Date(m.sentDate || m.SentDate),
                        isMe: (m.senderId || m.SenderId || m.senderID || m.SenderID) === this.currentUser.id,
                        isRead: m.isRead || m.IsRead
                    }));
                    this.scrollToBottom();
                } else {
                    console.log('⚠️ No chat history found to display');
                }

                // Set Contact Info for Header
                if (this.userRole === 'InteriorDesigner') {
                    // Designer is talking to Owner
                    this.contactName = this.workspaceData.designRequest?.userID === this.currentUser.id ? 'My Project' : 'Property Owner';

                    // Try to find the other user's photo from chat history
                    const otherUserMsg = this.messages.find(m => m.senderId !== this.currentUser.id);
                    this.contactPhoto = otherUserMsg?.senderPhoto || '';
                } else {
                    // Owner is talking to Designer
                    this.contactName = this.workspaceData.acceptedProposal?.designerName || 'Designer';

                    // Try to find the other user's photo from chat history
                    const otherUserMsg = this.messages.find(m => m.senderId !== this.currentUser.id);
                    this.contactPhoto = otherUserMsg?.senderPhoto || '';
                }

                // Join the chat room for this Specific Design Request (Isolate Project Chat)
                if (this.workspaceData.designRequest?.id) {
                    console.log(`🔌 [Workspace] Connecting to chat for RequestID: ${this.workspaceData.designRequest.id}`);
                    // We join a room based on Request ID to ensure isolation per project
                    this.chatService.joinChatRoom(this.workspaceData.designRequest.id);
                } else {
                    console.error('❌ [Workspace] Missing DesignRequest ID in workspace data!', rawData);
                }

                // Auto-open review modal if:
                // 1. Explicitly requested via query param
                // 2. OR it just became delivered via real-time update and user is owner
                const justDelivered = !previouslyDelivered && this.workspaceData.hasDelivered;
                const shouldAutoOpen = (this.route.snapshot.queryParamMap.get('openReview') === 'true') ||
                    (justDelivered && this.userRole === 'PropertyOwner');

                if (shouldAutoOpen && !this.workspaceData.hasReviewed) {
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

    private extractErrorMessage(err: any): string {
        if (!err) return 'Unknown error occurred';

        // 1. Check for specific backend error structure (e.g., { error: "Message..." })
        if (err.error && typeof err.error === 'object') {
            if (err.error.message) return err.error.message;
            if (err.error.error) return err.error.error; // Sometimes nested
            if (err.error.title) return err.error.title; // .NET ProblemDetails
        }

        // 2. Check for string error message in body
        if (typeof err.error === 'string') return err.error;

        // 3. Check top-level message
        if (err.message) return err.message;

        // 4. Fallback
        return 'Failed to send message (Server Error)';
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
            this.messageSubscription = this.chatService.messageReceived$.subscribe((m: any) => {
                // 🛑 PREVENT DUPLICATION: Ignore messages sent by me (already added optimistically)
                if (m.senderId === this.currentUser.id) {
                    return;
                }

                const currentRequestId = this.workspaceData?.designRequest.id;
                const incomingRequestId = m.designRequestId;
                const propertyId = this.workspaceData?.designRequest.propertyID;
                const incomingPropId = m.propertyId;

                // 🛡️ ISOLATION LOGIC:
                // 1. If message has RequestID, it MUST match current RequestID
                // 2. If message ONLY has PropertyID (legacy), we accept it if Property matches (backward compatibility)
                const isMatch = (incomingRequestId && incomingRequestId == currentRequestId) ||
                    (!incomingRequestId && incomingPropId && incomingPropId == propertyId);

                if (isMatch) {
                    const newMessage: ChatMessage = {
                        senderId: m.senderId,
                        senderName: m.senderName || (m.senderId === this.currentUser.id ? 'Me' : 'User'),
                        senderPhoto: m.senderPhoto,
                        message: m.messageText || m.message || '',
                        messageText: m.messageText || m.message || '',
                        messageType: m.messageType || 0,
                        timestamp: m.sentDate ? new Date(m.sentDate) : new Date(),
                        isMe: m.senderId === this.currentUser.id,
                        isRead: false
                    };

                    this.messages.push(newMessage);
                    this.scrollToBottom();
                }
            });
        }
    }

    sendMessage() {
        if (this.chatForm.invalid || !this.designRequestId) return;

        const msg = this.chatForm.get('message')?.value?.trim();
        if (!msg) return;

        const requestId = this.designRequestId;
        const senderId = this.currentUser?.id;

        // Optimistic UI Update
        const optimisticMessage: ChatMessage = {
            senderId: senderId,
            senderName: this.currentUser?.name || 'Me',
            senderPhoto: this.currentUser?.profilePicURL,
            message: msg,
            messageText: msg,
            messageType: 0, // Text
            timestamp: new Date(),
            isMe: true,
            isRead: false
        };

        this.messages.push(optimisticMessage);
        this.scrollToBottom();

        // Clear input immediately
        this.chatForm.reset();

        console.log(`📡 Sending message (Optimistic)... RequestID: ${requestId}, SenderID: ${senderId}`);

        this.chatService.sendMessageViaApi(requestId, msg, senderId).subscribe({
            next: (response) => {
                console.log('✅ Message sent successfully. Response:', response);
            },
            error: (err) => {
                console.error('❌ Failed to send message:', err);

                // A. Remove the optimistic message
                this.messages = this.messages.filter(m => m !== optimisticMessage);

                // B. Extract and Show Error
                const errorMsg = this.extractErrorMessage(err);

                this.messageService.add({
                    severity: 'error',
                    summary: 'Send Failed',
                    detail: errorMsg,
                    life: 5000
                });

                // C. Restore text to input so user can try again
                this.chatForm.patchValue({ message: msg });
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
