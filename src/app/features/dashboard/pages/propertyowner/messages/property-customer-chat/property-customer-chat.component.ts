import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CustomerChatService, CustomerChatMessage } from '../../../../../../core/services/customer-chat.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { LucideAngularModule, Send, ArrowLeft } from 'lucide-angular';
import { Subscription, filter } from 'rxjs';

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
  private chatService = inject(CustomerChatService);
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
        this.loadHistory();
        this.setupRealtime();
      }
    });

    // Ensure connection is active
    this.chatService.startConnection();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  loadHistory() {
    this.chatService.getChatHistory(this.propertyId, this.customerId).subscribe({
      next: (msgs) => {
        const myId = this.authService.getUserId();
        this.messages = msgs.map(m => ({
          ...m,
          isSelf: m.senderId === myId
        }));
        this.scrollToBottom();

        // ✅ Mark as read when opening chat
        this.chatService.markAsRead(this.propertyId, this.customerId).subscribe();
      }
    });
  }

  setupRealtime() {
    this.subscription = this.chatService.messageReceived$.subscribe(msg => {
      // Filter: Must match current property AND active customer context
      if (msg.propertyId == this.propertyId && (msg.senderId === this.customerId || msg.senderId === this.authService.getUserId())) {

        // Anti-duplication (Safety)
        if (msg.senderId === this.authService.getUserId()) return;

        this.messages.push({
          ...msg,
          isSelf: false
        });
        this.scrollToBottom();
      }
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
      propertyId: this.propertyId,
      isSelf: true
    };
    this.messages.push(optimisticMsg);

    // Clear Form
    this.chatForm.reset();

    // 2️⃣ API Call
    this.chatService.sendMessage(this.propertyId, text, this.customerId).subscribe({
      next: () => {
        this.sending = false;
        console.log('✅ Message sent');
      },
      error: (err) => {
        this.sending = false;
        console.error('❌ Failed to send:', err);
        // Rollback? Or show error
        // For now simple log
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
  }
}
