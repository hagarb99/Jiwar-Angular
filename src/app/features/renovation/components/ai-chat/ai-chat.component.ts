import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AiChatService, ChatMessage, ChatSender, ChatMessageType } from '../../services/ai-chat.service';
import { RenovationStateService } from '../../services/renovation-state.service';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { catchError, of, forkJoin } from 'rxjs';
import { RenovationApiService } from '../../services/renovation-api.service';
import { SimulationResultDto } from '../../models/renovation.models';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { SubscriptionService } from '../../../../core/services/subscription.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { SubscriptionPlan } from '../../../../core/models/subscription.model';
import { PricingCardComponent } from '../../../../shared/components/pricing-card/pricing-card.component';
import { PaymentModalComponent } from '../../../../shared/components/payment-modal/payment-modal.component';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-ai-chat',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        NavbarComponent,
        FooterComponent,
        ToastModule,
        PricingCardComponent,
        PaymentModalComponent
    ],
    templateUrl: './ai-chat.component.html',
    styleUrls: ['./ai-chat.component.css'],
    providers: [MessageService]
})
export class AiChatComponent implements OnInit {
    private chatService = inject(AiChatService);
    private renovationState = inject(RenovationStateService);
    private renovationApi = inject(RenovationApiService);
    private router = inject(Router);
    private messageService = inject(MessageService);
    private subscriptionService = inject(SubscriptionService);
    private paymentService = inject(PaymentService);
    private authService = inject(AuthService);

    @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

    messages: ChatMessage[] = [];
    newMessage: string = '';
    isLoading: boolean = false;
    simulationId: number | null = null;
    projectInfo: SimulationResultDto | null = null;
    plans: SubscriptionPlan[] = [];

    // Message Limit Logic
    readonly MAX_DAILY_MESSAGES = 15;
    dailyMessageCount: number = 0;
    isLimitReached: boolean = false;
    showPlans: boolean = false;
    processingId: number | null = null;

    // Payment Modal State
    showPaymentModal = false;
    paymobUrl = '';

    // Enums for template
    ChatSender = ChatSender;
    ChatMessageType = ChatMessageType;

    ngOnInit() {
        this.simulationId = this.renovationState.simulationId();
        if (!this.simulationId) {
            console.error('No simulation ID found. Redirecting to results.');
            this.router.navigate(['/renovation/results']);
            return;
        }

        this.loadMessageLimit();
        this.loadProjectDataAndHistory();
        this.loadPlans();
    }

    private loadPlans() {
        this.subscriptionService.getSubscriptions().subscribe({
            next: (data) => this.plans = data,
            error: (err) => console.error('Error fetching plans', err)
        });
    }

    private loadMessageLimit() {
        const limitData = localStorage.getItem('ai_chat_limit');
        const now = new Date();

        if (limitData) {
            const { count, resetDate } = JSON.parse(limitData);
            const resetTime = new Date(resetDate);

            if (now > resetTime) {
                this.dailyMessageCount = 0;
                this.updateLimitStorage(0);
            } else {
                this.dailyMessageCount = count;
                this.isLimitReached = this.dailyMessageCount >= this.MAX_DAILY_MESSAGES;
            }
        } else {
            this.updateLimitStorage(0);
        }
    }

    private updateLimitStorage(count: number) {
        const resetDate = new Date();
        resetDate.setHours(resetDate.getHours() + 24);

        const existingData = localStorage.getItem('ai_chat_limit');
        let finalResetDate = resetDate.toISOString();

        if (existingData && count > 0) {
            const { resetDate: existingResetDate } = JSON.parse(existingData);
            finalResetDate = existingResetDate;
        }

        localStorage.setItem('ai_chat_limit', JSON.stringify({
            count,
            resetDate: finalResetDate
        }));
    }

    loadProjectDataAndHistory() {
        if (!this.simulationId) return;

        this.isLoading = true;

        forkJoin({
            projectData: this.renovationApi.getResults(this.simulationId).pipe(catchError(() => of(null))),
            history: this.chatService.getHistory(this.simulationId).pipe(catchError(() => of([])))
        }).subscribe(({ projectData, history }) => {
            this.projectInfo = projectData;
            this.messages = history;

            if (this.messages.length === 0) {
                this.startNewChat();
            } else {
                this.isLoading = false;
                this.scrollToBottom();
            }
        });
    }

    startNewChat() {
        if (!this.simulationId) return;

        this.isLoading = true;
        this.chatService.startChat(this.simulationId).subscribe({
            next: (res) => {
                this.messages.push({
                    sender: ChatSender.AI,
                    messageType: ChatMessageType.Text,
                    content: this.cleanMessage(res.message),
                    createdAt: new Date().toISOString()
                });
                this.isLoading = false;
                this.scrollToBottom();
            },
            error: (err) => {
                console.error('Error starting chat:', err);
                this.isLoading = false;
            }
        });
    }

    private cleanMessage(text: string): string {
        return text
            .replace(/[#*`_~]/g, '')
            .replace(/\[.*\]\(.*\)/g, '')
            .trim();
    }

    send() {
        if (!this.newMessage.trim() || !this.simulationId || this.isLoading) return;

        if (this.isLimitReached) {
            this.showLimitReachedMessage();
            return;
        }

        const userMsgContent = this.newMessage;
        this.newMessage = '';

        this.messages.push({
            sender: ChatSender.User,
            messageType: ChatMessageType.Text,
            content: userMsgContent,
            createdAt: new Date().toISOString()
        });

        this.dailyMessageCount++;
        this.updateLimitStorage(this.dailyMessageCount);

        if (this.dailyMessageCount >= this.MAX_DAILY_MESSAGES) {
            this.isLimitReached = true;
        }

        this.scrollToBottom();
        this.isLoading = true;

        this.chatService.sendMessage(this.simulationId, userMsgContent).subscribe({
            next: (res) => {
                this.messages.push({
                    sender: ChatSender.AI,
                    messageType: ChatMessageType.Text,
                    content: this.cleanMessage(res.response),
                    createdAt: new Date().toISOString()
                });
                this.isLoading = false;
                this.scrollToBottom();

                if (this.isLimitReached) {
                    setTimeout(() => {
                        this.showLimitReachedMessage();
                    }, 500);
                }
            },
            error: (err) => {
                console.error('Error sending message:', err);
                this.isLoading = false;
                if (err.status === 401) {
                    this.messageService.add({ severity: 'warn', summary: 'Login Required', detail: 'Please log in to continue chatting.' });
                } else if (err.error?.message?.includes('quota')) {
                    this.showLimitReachedMessage();
                }
            }
        });
    }

    private showLimitReachedMessage() {
        this.messages.push({
            sender: ChatSender.AI,
            messageType: ChatMessageType.Text,
            content: "You’ve reached your daily AI consultation limit. Please upgrade your plan for unlimited elite consultation.",
            createdAt: new Date().toISOString()
        });
        this.showPlans = true;
        this.scrollToBottom();
    }

    onFileUpload(event: any, type: 'Image' | 'Video') {
        const file = event.target.files[0];
        if (!file || !this.simulationId) return;

        this.messages.push({
            sender: ChatSender.User,
            messageType: type === 'Image' ? ChatMessageType.Image : ChatMessageType.Video,
            content: `Uploading ${type.toLowerCase()}...`,
            createdAt: new Date().toISOString()
        });

        this.scrollToBottom();

        if (type === 'Image') {
            this.chatService.uploadImage(this.simulationId, file).subscribe({
                next: (res) => {
                    const msgIdx = this.messages.findIndex(m => m.content === `Uploading image...`);
                    if (msgIdx !== -1) {
                        this.messages[msgIdx].content = res.fileUrl;
                    }
                    this.scrollToBottom();
                },
                error: (err) => {
                    console.error('Upload failed', err);
                    this.messageService.add({ severity: 'error', summary: 'Upload Failed', detail: 'Could not upload image.' });
                }
            });
        } else {
            this.messageService.add({ severity: 'info', summary: 'Video Upload', detail: 'Video analysis is a premium feature.' });
        }
    }

    onVoiceUpload() {
        this.messageService.add({ severity: 'info', summary: 'Voice Feature', detail: 'Voice consultation is coming soon for Golden Plans!' });
    }

    handleSubscribe(plan: SubscriptionPlan): void {
        if (!this.authService.isLoggedIn()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Authentication Required',
                detail: 'Please log in to proceed with payment.'
            });
            this.router.navigate(['/login']);
            return;
        }

        if (!plan.id) return;
        this.processingId = plan.id;

        this.paymentService.createSubscriptionPayment(plan.id).subscribe({
            next: (res) => {
                this.paymobUrl = res.iframeUrl;
                this.showPaymentModal = true;
                this.processingId = null;
            },
            error: (err) => {
                console.error('Payment error', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Payment Error',
                    detail: 'Could not initiate payment session.'
                });
                this.processingId = null;
            }
        });
    }

    onPaymentClose() {
        this.showPaymentModal = false;
        this.paymobUrl = '';
    }

    navigateToSubscriptions() {
        this.router.navigate(['/subscriptions']);
    }

    private scrollToBottom(): void {
        setTimeout(() => {
            try {
                if (this.scrollContainer) {
                    this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
                }
            } catch (err) { }
        }, 100);
    }
}
