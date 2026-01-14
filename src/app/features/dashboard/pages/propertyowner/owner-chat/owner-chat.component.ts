import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatService, ChatMessage } from '../../../../../core/services/chat.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { LucideAngularModule, Send, User, MessageSquare } from 'lucide-angular';

@Component({
  selector: 'app-owner-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './owner-chat.component.html',
  styleUrls: ['./owner-chat.component.css']
})
export class OwnerChatComponent implements OnInit, OnDestroy {
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);
  private chatService: ChatService = inject(ChatService);
  private authService: AuthService = inject(AuthService);

  propertyId!: number;
  customerId!: string;
  messages: ChatMessage[] = [];
  newMessage = '';

  get currentUserId(): string {
    return this.authService.getUserId() || '';
  }

  // Icons
  Send = Send;
  User = User;
  MessageSquare = MessageSquare;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.propertyId = Number(params.get('propertyId'));
      this.customerId = params.get('customerId') || '';

      if (this.propertyId && this.customerId) {
        this.initializeChat();
      }
    });
  }

  initializeChat(): void {
    const token = this.authService.getToken();
    if (token) {
      this.chatService.startConnection(token);

      // Wait for connection
      setTimeout(() => {
        this.chatService.joinPropertyChatRoom(this.propertyId, this.customerId);
      }, 1000);

      this.chatService.messageReceived$.subscribe((msg: ChatMessage) => {
        // 🛑 PREVENT DUPLICATION: Ignore messages sent by me (already added optimistically)
        if (msg.senderId === this.currentUserId) {
          return;
        }
        this.messages.push(msg);
      });
    }
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;

    const msgText = this.newMessage;
    this.newMessage = '';

    // Optimistic Update
    this.messages.push({
      senderId: this.authService.getUserId() || '',
      message: msgText,
      sentDate: new Date().toISOString(),
      propertyId: this.propertyId
    } as ChatMessage);

    this.chatService.sendPropertyChatMessage(this.propertyId, msgText, this.customerId)
      .subscribe({
        error: (err: any) => console.error('Failed to send message', err)
      });
  }

  ngOnDestroy(): void {
    // Optionally leave room or stop connection if needed, but service handles singular connection
  }
}
