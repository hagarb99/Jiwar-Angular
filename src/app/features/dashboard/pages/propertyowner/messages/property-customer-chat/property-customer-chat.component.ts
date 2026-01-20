import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CustomerPropertyChatService } from '../../../../../../core/services/customer-property-chat.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { LucideAngularModule, Send, ArrowLeft } from 'lucide-angular';
import { Subscription } from 'rxjs';

export interface CustomerChatMessage {
  senderId: string;
  message: string;
  sentDate: string;
  isSelf: boolean;
}

@Component({
  selector: 'app-property-customer-chat',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, RouterModule],
  template: `
    <div class="flex flex-col h-[calc(100vh-120px)] bg-gray-50 max-w-5xl mx-auto rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
      
      <!-- Header -->
      <div class="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button (click)="goBack()" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <lucide-angular [img]="ArrowLeft" class="w-5 h-5 text-gray-600"></lucide-angular>
          </button>
          <div>
            <h2 class="font-bold text-gray-800">Customer Chat</h2>
            <p class="text-xs text-gray-500">Property ID: {{ propertyId }}</p>
          </div>
        </div>
      </div>

      <!-- Messages Area -->
      <div #chatContainer class="flex-1 overflow-y-auto p-6 space-y-4" [scrollTop]="scrollTop">
        <div *ngFor="let msg of messages" 
             class="flex w-full" 
             [ngClass]="msg.isSelf ? 'justify-end' : 'justify-start'">
          
          <div class="max-w-[70%] rounded-2xl px-4 py-3 shadow-sm relative"
               [ngClass]="msg.isSelf 
                  ? 'bg-primary text-white rounded-br-none' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'">
            
            <p class="text-sm whitespace-pre-wrap">{{ msg.message }}</p>
            <span class="text-[10px] block mt-1 opacity-70" 
                  [ngClass]="msg.isSelf ? 'text-blue-100' : 'text-gray-400'">
              {{ msg.sentDate | date:'shortTime' }}
            </span>
          </div>
        </div>
        
        <div *ngIf="messages.length === 0" class="text-center text-gray-400 mt-10">
          <p>No messages yet. Start the conversation!</p>
        </div>
      </div>

      <!-- Input Area -->
      <div class="bg-white p-4 border-t border-gray-100">
        <form [formGroup]="chatForm" (ngSubmit)="sendMessage()" class="flex gap-2">
          <input 
            type="text" 
            formControlName="message" 
            placeholder="Type your reply..." 
            class="flex-1 bg-gray-50 border-gray-200 rounded-lg px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
          />
          <button 
            type="submit" 
            [disabled]="chatForm.invalid || sending"
            class="bg-primary text-white p-3 rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md">
            <lucide-angular [img]="Send" class="w-5 h-5"></lucide-angular>
          </button>
        </form>
      </div>

    </div>
  `,
  styles: []
})
export class PropertyCustomerChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private chatService = inject(CustomerPropertyChatService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  propertyId!: number;
  customerId!: string;
  messages: CustomerChatMessage[] = [];

  subscription!: Subscription;
  scrollTop = 0;
  sending = false;

  @ViewChild('chatContainer') chatContainer!: ElementRef;

  // Icons
  Send = Send;
  ArrowLeft = ArrowLeft;

  chatForm = this.fb.group({
    message: ['', [Validators.required, Validators.minLength(1)]]
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.propertyId = Number(params.get('propertyId'));
      this.customerId = params.get('customerId') || '';

      if (this.propertyId && this.customerId) {
        this.initializeChat();
      }
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  initializeChat() {
    // 1. Start Connection
    this.chatService.startConnection();

    // 2. Join Room (Delay slightly to ensure connection is ready, though service handles it)
    setTimeout(() => {
      this.chatService.joinChat(this.propertyId, this.customerId);
    }, 500);

    // 3. Load History
    this.chatService.loadChatHistory(this.propertyId, this.customerId).subscribe({
      next: (msgs) => {
        this.messages = msgs.map(m => ({
          senderId: m.senderId,
          message: m.messageText, // Normalized by service now
          sentDate: m.createdAt,
          isSelf: m.isMine
        }));
        this.scrollToBottom();
      }
    });

    // 4. Setup Real-time (using the signal or subject)
    this.setupRealtime();
  }

  setupRealtime() {
    this.subscription = this.chatService.newMessage$.subscribe(msg => {
      // Avoid duplication if the message is already optimistic (check mostly by content/time if ID is missing in local opt)
      // Since specific IDs might be tricky with optimistic, we just append if it's from OTHERS.
      // If it's from US, we might have already added it. 
      // Current Service sends back 'ReceiveMessage' even for self.

      // Since we clear form immediately on send, we primarily rely on the echoed message 
      // OR optimistic update. 
      // Let's rely on the service's logic: MessageDto comes in.

      // If we used optimistic update, we might get a duplicate.
      // Simple fix: If it's mine, don't re-add if we recently added one? 
      // OR: Don't do optimistic update in UI, rely on the instant echo from signal if local.
      // BUT: The user complained about need to refresh -> implies echo wasn't happening or was on wrong channel.

      // With correct channel, echo should happen.
      // Let's map it and push.

      console.log('⚡ Realtime msg received:', msg);

      const newMsg: CustomerChatMessage = {
        senderId: msg.senderId,
        message: msg.messageText,
        sentDate: msg.createdAt,
        isSelf: msg.isMine
      };

      // Check if we already have this exact message (simple dedup)
      const lastMsg = this.messages[this.messages.length - 1];
      if (lastMsg && lastMsg.isSelf && lastMsg.message === newMsg.message && newMsg.isSelf) {
        // Likely the optimistic one we just added. 
        // Update it (e.g. set ID) or ignore.
        // For now, assume optimistic is 'pending' and this confirms it.
        // If we want to be safe, just don't add if it matches exactly recent one.
        return;
      }

      this.messages.push(newMsg);
      this.scrollToBottom();
    });
  }

  sendMessage() {
    if (this.chatForm.invalid) return;

    const text = this.chatForm.get('message')?.value?.trim();
    if (!text) return;

    this.sending = true;

    // 1️⃣ Optimistic Update
    const myId = this.authService.getUserId() || '';
    const optimisticMsg: CustomerChatMessage = {
      senderId: myId,
      message: text,
      sentDate: new Date().toISOString(),
      isSelf: true
    };
    this.messages.push(optimisticMsg);
    this.scrollToBottom();

    // Clear Form
    this.chatForm.reset();

    // 2️⃣ API Call (using new service)
    const dto = {
      propertyId: this.propertyId,
      messageText: text,
      receiverId: this.customerId
    };

    this.chatService.sendMessage(dto).subscribe({
      next: () => {
        this.sending = false;
        console.log('✅ Message sent');
      },
      error: (err) => {
        this.sending = false;
        console.error('❌ Failed to send:', err);
        // Remove the optimistic message on failure?
        this.messages.pop();
      }
    });
  }

  scrollToBottom() {
    try {
      if (this.chatContainer) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    } catch (err) { }
  }

  goBack() {
    this.router.navigate(['/dashboard/propertyowner/messages']);
  }

  ngOnDestroy() {
    if (this.subscription) this.subscription.unsubscribe();
    // Leave the chat room to clean up
    if (this.propertyId && this.customerId) {
      this.chatService.leaveChat(this.propertyId, this.customerId);
    }
  }
}
