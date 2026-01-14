import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ViewChild,
  ElementRef,
  AfterViewChecked
} from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Send, MessageCircle, MoreVertical, User, Phone, Video, Paperclip, Smile, CheckCheck, Clock } from 'lucide-angular';
import { CustomerPropertyChatService } from '../../../../../core/services/customer-property-chat.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { MessageDto, SendMessageDto } from '../../../../../core/models/chat.models';

/**
 * ChatRoomComponent - Real-time messaging interface
 * Features:
 * - SignalR live messaging
 * - Message bubbles aligned by isMine flag
 * - Auto-scroll to bottom
 * - OnDestroy cleanup with leaveChat
 */
@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="chat-room-container">
      <!-- Header -->
      <header class="chat-room-header">
        <div class="header-left">
          <button 
            class="back-button"
            (click)="goBack()"
            aria-label="Go back"
          >
            <lucide-angular [img]="ArrowLeft" class="icon-sm"></lucide-angular>
          </button>
          
          <div class="chat-info">
            <div class="avatar-wrapper">
              <div class="avatar-gradient">
                <lucide-angular [img]="MessageCircle" class="avatar-icon"></lucide-angular>
              </div>
              <span class="online-indicator" [class.online]="chatService.isConnected()"></span>
            </div>
            <div class="chat-details">
              <h2 class="chat-title">{{ propertyTitle() || 'Property Chat' }}</h2>
              <span class="chat-status">
                @switch (chatService.connectionStatus()) {
                  @case ('connected') { <span class="status-live">● Live</span> }
                  @case ('connecting') { <span class="status-connecting">Connecting...</span> }
                  @case ('reconnecting') { <span class="status-reconnecting">Reconnecting...</span> }
                  @default { <span class="status-offline">Offline</span> }
                }
              </span>
            </div>
          </div>
        </div>
        
        <div class="header-actions">
          <button class="action-btn" aria-label="Voice call">
            <lucide-angular [img]="Phone" class="icon-sm"></lucide-angular>
          </button>
          <button class="action-btn" aria-label="Video call">
            <lucide-angular [img]="Video" class="icon-sm"></lucide-angular>
          </button>
          <button class="action-btn" aria-label="More options">
            <lucide-angular [img]="MoreVertical" class="icon-sm"></lucide-angular>
          </button>
        </div>
      </header>

      <!-- Messages Area -->
      <main class="messages-area" #scrollContainer>
        @if (loading()) {
          <!-- Loading State -->
          <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading messages...</p>
          </div>
        } @else if (messages().length === 0) {
          <!-- Empty State -->
          <div class="empty-messages">
            <div class="empty-icon-wrapper">
              <lucide-angular [img]="MessageCircle" class="empty-icon"></lucide-angular>
            </div>
            <h3>Start the conversation</h3>
            <p>Send a message to begin chatting about this property</p>
          </div>
        } @else {
          <!-- Message List -->
          <div class="messages-list">
            @for (message of messages(); track message.id; let i = $index) {
              <!-- Date Separator -->
              @if (shouldShowDateSeparator(i)) {
                <div class="date-separator">
                  <span>{{ formatDateSeparator(message.createdAt) }}</span>
                </div>
              }
              
              <!-- Message Bubble -->
              <div 
                class="message-wrapper"
                [class.mine]="message.isMine"
                [class.other]="!message.isMine"
              >
                @if (!message.isMine) {
                  <div class="sender-avatar">
                    <lucide-angular [img]="User" class="sender-icon"></lucide-angular>
                  </div>
                }
                
                <div class="message-bubble-container">
                  @if (!message.isMine && shouldShowSenderName(i)) {
                    <span class="sender-name">{{ message.senderName }}</span>
                  }
                  
                  <div class="message-bubble">
                    <p class="message-text">{{ message.messageText }}</p>
                    <div class="message-meta">
                      <span class="message-time">{{ formatTime(message.createdAt) }}</span>
                      @if (message.isMine) {
                        <lucide-angular 
                          [img]="message.isRead ? CheckCheck : Clock" 
                          class="read-indicator"
                          [class.read]="message.isRead"
                        ></lucide-angular>
                      }
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </main>

      <!-- Input Area -->
      <footer class="input-area">
        <form class="message-form" (ngSubmit)="sendMessage()">
          <div class="input-actions">
            <button type="button" class="input-action-btn" aria-label="Attach file">
              <lucide-angular [img]="Paperclip" class="icon-sm"></lucide-angular>
            </button>
          </div>
          
          <div class="input-wrapper">
            <input 
              type="text" 
              class="message-input"
              [(ngModel)]="messageText"
              name="message"
              placeholder="Type a message..."
              [disabled]="!chatService.isConnected() || sending()"
              autocomplete="off"
              (keydown.enter)="sendMessage()"
            />
            <button type="button" class="emoji-btn" aria-label="Add emoji">
              <lucide-angular [img]="Smile" class="icon-sm"></lucide-angular>
            </button>
          </div>
          
          <button 
            type="submit" 
            class="send-button"
            [disabled]="!canSend()"
            aria-label="Send message"
          >
            <lucide-angular [img]="Send" class="send-icon"></lucide-angular>
          </button>
        </form>
        
        <p class="secure-notice">
          🔒 End-to-end encrypted conversation
        </p>
      </footer>
    </div>
  `,
  styles: [`
    .chat-room-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      max-height: 100vh;
      background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%);
    }

    /* ═══════════════════════════════════════════════════════════════════════ */
    /* HEADER */
    /* ═══════════════════════════════════════════════════════════════════════ */
    .chat-room-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      flex-shrink: 0;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .back-button {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.75rem;
      background: rgba(255, 255, 255, 0.08);
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .back-button:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateX(-2px);
    }

    .chat-info {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }

    .avatar-wrapper {
      position: relative;
    }

    .avatar-gradient {
      width: 3rem;
      height: 3rem;
      border-radius: 1rem;
      background: linear-gradient(135deg, #d4af37 0%, #f4c542 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(212, 175, 55, 0.3);
    }

    .avatar-icon {
      width: 1.25rem;
      height: 1.25rem;
      color: white;
    }

    .online-indicator {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 0.875rem;
      height: 0.875rem;
      border-radius: 50%;
      background: #6b7280;
      border: 2px solid #1a1a2e;
    }

    .online-indicator.online {
      background: #22c55e;
      box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
    }

    .chat-details {
      display: flex;
      flex-direction: column;
    }

    .chat-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: white;
      margin: 0;
    }

    .chat-status {
      font-size: 0.75rem;
    }

    .status-live { color: #22c55e; }
    .status-connecting { color: #facc15; }
    .status-reconnecting { color: #f97316; }
    .status-offline { color: #6b7280; }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.75rem;
      background: rgba(255, 255, 255, 0.08);
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      background: rgba(212, 175, 55, 0.2);
    }

    .icon-sm {
      width: 1.125rem;
      height: 1.125rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .action-btn:hover .icon-sm {
      color: #d4af37;
    }

    /* ═══════════════════════════════════════════════════════════════════════ */
    /* MESSAGES AREA */
    /* ═══════════════════════════════════════════════════════════════════════ */
    .messages-area {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
      scroll-behavior: smooth;
    }

    .messages-area::-webkit-scrollbar {
      width: 6px;
    }

    .messages-area::-webkit-scrollbar-track {
      background: transparent;
    }

    .messages-area::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
    }

    /* Loading State */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 1rem;
    }

    .loading-spinner {
      width: 3rem;
      height: 3rem;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top-color: #d4af37;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-state p {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.875rem;
    }

    /* Empty State */
    .empty-messages {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      padding: 2rem;
    }

    .empty-icon-wrapper {
      width: 5rem;
      height: 5rem;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
    }

    .empty-icon {
      width: 2.5rem;
      height: 2.5rem;
      color: rgba(255, 255, 255, 0.3);
    }

    .empty-messages h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: white;
      margin: 0 0 0.5rem;
    }

    .empty-messages p {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.5);
      margin: 0;
      max-width: 280px;
    }

    /* Messages List */
    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    /* Date Separator */
    .date-separator {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 1rem 0;
    }

    .date-separator span {
      padding: 0.375rem 1rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2rem;
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
      font-weight: 500;
    }

    /* Message Wrapper */
    .message-wrapper {
      display: flex;
      gap: 0.625rem;
      max-width: 80%;
      animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .message-wrapper.mine {
      align-self: flex-end;
      flex-direction: row-reverse;
    }

    .message-wrapper.other {
      align-self: flex-start;
    }

    /* Sender Avatar (for others' messages) */
    .sender-avatar {
      width: 2rem;
      height: 2rem;
      border-radius: 0.625rem;
      background: rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .sender-icon {
      width: 1rem;
      height: 1rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .message-bubble-container {
      display: flex;
      flex-direction: column;
    }

    .sender-name {
      font-size: 0.6875rem;
      color: rgba(255, 255, 255, 0.5);
      margin-bottom: 0.25rem;
      margin-left: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Message Bubble */
    .message-bubble {
      padding: 0.875rem 1rem;
      border-radius: 1.25rem;
      position: relative;
    }

    .mine .message-bubble {
      background: linear-gradient(135deg, #d4af37 0%, #c5a028 100%);
      border-bottom-right-radius: 0.375rem;
      color: white;
    }

    .other .message-bubble {
      background: rgba(255, 255, 255, 0.1);
      border-bottom-left-radius: 0.375rem;
      color: white;
    }

    .message-text {
      font-size: 0.9375rem;
      line-height: 1.5;
      margin: 0;
      word-wrap: break-word;
    }

    .message-meta {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.375rem;
      margin-top: 0.375rem;
    }

    .message-time {
      font-size: 0.6875rem;
      opacity: 0.7;
    }

    .read-indicator {
      width: 0.875rem;
      height: 0.875rem;
      opacity: 0.7;
    }

    .read-indicator.read {
      color: #22d3ee;
      opacity: 1;
    }

    /* ═══════════════════════════════════════════════════════════════════════ */
    /* INPUT AREA */
    /* ═══════════════════════════════════════════════════════════════════════ */
    .input-area {
      padding: 1rem 1.5rem;
      background: rgba(255, 255, 255, 0.03);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      flex-shrink: 0;
    }

    .message-form {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .input-actions {
      display: flex;
      gap: 0.5rem;
    }

    .input-action-btn, .emoji-btn {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.75rem;
      background: rgba(255, 255, 255, 0.08);
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .input-action-btn:hover, .emoji-btn:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .input-wrapper {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
    }

    .message-input {
      width: 100%;
      padding: 0.875rem 3rem 0.875rem 1.25rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 1.5rem;
      color: white;
      font-size: 0.9375rem;
      transition: all 0.3s ease;
    }

    .message-input::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }

    .message-input:focus {
      outline: none;
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(212, 175, 55, 0.5);
      box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.1);
    }

    .message-input:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .emoji-btn {
      position: absolute;
      right: 0.375rem;
      width: 2rem;
      height: 2rem;
      background: transparent;
    }

    .send-button {
      width: 3rem;
      height: 3rem;
      border-radius: 1rem;
      background: linear-gradient(135deg, #d4af37 0%, #f4c542 100%);
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 20px rgba(212, 175, 55, 0.3);
    }

    .send-button:hover:not(:disabled) {
      transform: scale(1.05);
      box-shadow: 0 6px 25px rgba(212, 175, 55, 0.4);
    }

    .send-button:active:not(:disabled) {
      transform: scale(0.95);
    }

    .send-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
    }

    .send-icon {
      width: 1.25rem;
      height: 1.25rem;
      color: white;
    }

    .secure-notice {
      text-align: center;
      font-size: 0.6875rem;
      color: rgba(255, 255, 255, 0.4);
      margin: 0.75rem 0 0;
    }

    /* ═══════════════════════════════════════════════════════════════════════ */
    /* RESPONSIVE */
    /* ═══════════════════════════════════════════════════════════════════════ */
    @media (max-width: 640px) {
      .chat-room-header {
        padding: 0.875rem 1rem;
      }

      .chat-title {
        font-size: 1rem;
      }

      .header-actions {
        gap: 0.25rem;
      }

      .action-btn {
        width: 2.25rem;
        height: 2.25rem;
      }

      .messages-area {
        padding: 1rem;
      }

      .message-wrapper {
        max-width: 90%;
      }

      .input-area {
        padding: 0.875rem 1rem;
      }

      .input-actions {
        display: none;
      }
    }
  `]
})
export class ChatRoomComponent implements OnInit, OnDestroy, AfterViewChecked {
  readonly chatService = inject(CustomerPropertyChatService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  // Lucide icons
  readonly ArrowLeft = ArrowLeft;
  readonly Send = Send;
  readonly MessageCircle = MessageCircle;
  readonly MoreVertical = MoreVertical;
  readonly User = User;
  readonly Phone = Phone;
  readonly Video = Video;
  readonly Paperclip = Paperclip;
  readonly Smile = Smile;
  readonly CheckCheck = CheckCheck;
  readonly Clock = Clock;

  // Route params
  private propertyId: number = 0;
  private customerId: string = '';

  // Component state
  readonly loading = signal(true);
  readonly sending = signal(false);
  readonly propertyTitle = signal('');
  messageText = '';

  // Messages from service
  readonly messages = this.chatService.messages;

  // Can send check
  readonly canSend = computed(() =>
    this.messageText.trim().length > 0 &&
    this.chatService.isConnected() &&
    !this.sending()
  );

  private shouldScroll = false;
  private messageSubscription?: Subscription;

  ngOnInit(): void {
    // Extract route params
    this.route.params.subscribe(params => {
      this.propertyId = +params['propertyId'];
      this.customerId = params['customerId'];

      if (this.propertyId && this.customerId) {
        this.initializeChat();
      }
    });

    // Extract property title from query params if available
    this.route.queryParams.subscribe(params => {
      if (params['title']) {
        this.propertyTitle.set(params['title']);
      }
    });

    // Subscribe to new messages for auto-scroll
    this.messageSubscription = this.chatService.newMessage$.subscribe(() => {
      this.shouldScroll = true;
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    // Clean up subscription
    this.messageSubscription?.unsubscribe();

    // IMPORTANT: Leave the chat room to prevent memory leaks in SignalR
    if (this.propertyId && this.customerId) {
      this.chatService.leaveChat(this.propertyId, this.customerId);
    }
  }



  private initializeChat(): void {
    if (!this.propertyId || isNaN(this.propertyId) || !this.customerId) {
      console.warn('⚠️ [ChatRoom] Missing parameter propertyId or customerId');
      this.loading.set(false);
      // Optional: Redirect back
      this.router.navigate(['/dashboard/chat']);
      return;
    }

    this.loading.set(true);

    // Validate customerId for SignalR Group Name consistency
    // Rule: The Group Name is ALWAYS PropertyChat_{propertyId}_{customerId}
    // where customerId is the ID of the customer who made the booking.
    if (this.authService.userRole === 'Customer') {
      const myId = this.authService.getUserId();
      if (myId && this.customerId !== myId) {
        console.warn(`⚠️ [ChatRoom] URL customerId (${this.customerId}) does not match logged-in Customer (${myId}). using logged-in ID.`);
        this.customerId = myId;
      }
    }

    console.log(`🚀 [ChatRoom] Initializing chat for Room: Property=${this.propertyId}, Customer=${this.customerId}`);

    // Ensure connection is started
    this.chatService.startConnection();

    // Join the specific chat room
    // The service handles queuing this if connection is not ready yet
    this.chatService.joinChat(this.propertyId, this.customerId);

    // Load message history
    // NOTE: The backend automatically marks messages as read when history is fetched
    this.chatService.loadChatHistory(this.propertyId, this.customerId)
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.shouldScroll = true;
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  sendMessage(): void {
    const text = this.messageText.trim();
    // Allow sending as long as we have text (connection might still be establishing)
    if (!text) return;

    this.sending.set(true);

    const dto: SendMessageDto = {
      propertyId: this.propertyId,
      messageText: text
    };

    // If Property Owner, we must start the receiverId (the customer we are talking to)
    // If Customer, receiverId can be omitted (context implies owner)
    if (this.authService.userRole === 'PropertyOwner') {
      dto.receiverId = this.customerId;
    }

    this.chatService.sendMessage(dto).subscribe({
      next: () => {
        this.messageText = '';
        this.sending.set(false);
        this.shouldScroll = true;
      },
      error: () => {
        this.sending.set(false);
        // Could show error toast here
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/chat']);
  }

  scrollToBottom(): void {
    try {
      const container = this.scrollContainer?.nativeElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }

  shouldShowDateSeparator(index: number): boolean {
    if (index === 0) return true;

    const messages = this.messages();
    const current = new Date(messages[index].createdAt).toDateString();
    const previous = new Date(messages[index - 1].createdAt).toDateString();

    return current !== previous;
  }

  shouldShowSenderName(index: number): boolean {
    if (index === 0) return true;

    const messages = this.messages();
    return messages[index].senderId !== messages[index - 1].senderId;
  }

  formatDateSeparator(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
    }
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
}

