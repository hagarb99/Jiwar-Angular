import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ChatService, ChatMessage } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subject, takeUntil } from 'rxjs';
import { LucideAngularModule, Send, MessageCircle, User, ArrowLeft, MoreVertical } from 'lucide-angular';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  messages: ChatMessage[] = [];
  messageText = '';
  propertyId: number = 0;
  currentUserId: string = '';
  loading = true;
  connectionStatus = false;

  // Icons
  Send = Send;
  MessageCircle = MessageCircle;
  User = User;
  ArrowLeft = ArrowLeft;
  MoreVertical = MoreVertical;

  ngOnInit(): void {
    this.currentUserId = this.authService.getUserId() || '';

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      // We can get propertyId from query params or route params
      // Assuming route like /chat?propertyId=123
      this.propertyId = +params['propertyId'];

      if (this.propertyId) {
        this.initChat();
      } else {
        // Fallback or error handling
        console.error('No propertyId provided for chat');
      }
    });

    // Subscriptions
    this.chatService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(msgs => {
        this.messages = msgs;
        this.loading = false;
      });

    this.chatService.connectionStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.connectionStatus = status;
      });
  }

  private initChat(): void {
    const token = localStorage.getItem('token') || '';
    this.chatService.clearMessages();
    this.chatService.startConnection(token, this.propertyId);

    // Potentially fetch history here if the API exists
    // this.chatService.getChatHistory(this.propertyId).subscribe(...)
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  sendMessage() {
    if (!this.messageText.trim() || !this.propertyId) return;

    const text = this.messageText.trim();
    this.messageText = '';

    this.chatService.sendPropertyMessageViaApi(this.propertyId, text).subscribe({
      next: () => {
        // Message will be received back via SignalR
        console.log('Message sent successfully via API');
      },
      error: (err) => {
        console.error('Failed to send message:', err);
        // Potential UI feedback
      }
    });
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }

  ngOnDestroy(): void {
    this.chatService.stopConnection();
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
