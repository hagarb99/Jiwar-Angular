import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CustomerChatService, OwnerInboxItem } from '../../../../../../core/services/customer-chat.service';
import { LucideAngularModule, MessageSquare, Clock } from 'lucide-angular';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-owner-inbox',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule],
    template: `
    <div class="p-6 max-w-5xl mx-auto">
      <h1 class="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        <lucide-angular [img]="MessageSquare" class="w-6 h-6"></lucide-angular>
        Messages Inbox
      </h1>

      <!-- Loading State -->
      <div *ngIf="loading" class="text-center py-12">
        <i class="pi pi-spin pi-spinner text-2xl text-primary"></i>
        <p class="text-gray-500 mt-2">Loading conversations...</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && (inbox$ | async)?.length === 0" class="text-center py-12 bg-gray-50 rounded-xl">
        <lucide-angular [img]="MessageSquare" class="w-12 h-12 text-gray-300 mx-auto mb-3"></lucide-angular>
        <p class="text-gray-500">No messages yet.</p>
      </div>

      <!-- Inbox List -->
      <div *ngIf="!loading" class="grid gap-4">
        <div *ngFor="let item of inbox$ | async" 
             (click)="openChat(item)"
             class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group">
          
          <div class="flex items-start gap-4">
            <!-- Avatar Placeholder -->
            <div class="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
              {{ item.customerName.charAt(0).toUpperCase() }}
            </div>

            <div>
              <h3 class="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                {{ item.customerName }}
                <span class="text-xs font-normal text-gray-500 ml-2">on {{ item.propertyName }}</span>
              </h3>
              <p class="text-gray-600 text-sm mt-1 truncate max-w-md">{{ item.lastMessage }}</p>
            </div>
          </div>

          <div class="flex flex-col items-end gap-2">
            <span class="text-xs text-gray-400 flex items-center gap-1">
              <lucide-angular [img]="Clock" class="w-3 h-3"></lucide-angular>
              {{ item.lastMessageDate | date:'shortTime' }}
            </span>
            <span *ngIf="item.unreadCount > 0" class="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {{ item.unreadCount }} new
            </span>
          </div>

        </div>
      </div>
    </div>
  `,
    styles: []
})
export class OwnerInboxComponent implements OnInit {
    private chatService = inject(CustomerChatService);
    private router = inject(Router);

    inbox$ = this.chatService.inbox$;
    loading = true;

    // Icons
    MessageSquare = MessageSquare;
    Clock = Clock;

    ngOnInit() {
        this.chatService.startConnection();
        this.loadInbox();
    }

    loadInbox() {
        this.loading = true;
        this.chatService.getOwnerInbox().subscribe({
            next: () => this.loading = false,
            error: () => this.loading = false
        });
    }

    openChat(item: OwnerInboxItem) {
        // Navigate to Chat Component
        // Route: /dashboard/propertyowner/messages/property/:propertyId/customer/:customerId
        this.router.navigate(['/dashboard/propertyowner/messages/property', item.propertyId, 'customer', item.customerId]);
    }
}
