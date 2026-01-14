import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, MessageCircle, Search, User, Home, Clock, ChevronRight } from 'lucide-angular';
import { CustomerPropertyChatService } from '../../../../../core/services/customer-property-chat.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { ChatThreadDto } from '../../../../../core/models/chat.models';
import { environment } from '../../../../../../environments/environment';


/**
 * ChatListComponent - Displays chat threads for Customers and Property Owners
 * Uses modern Angular features: Signals, @for syntax, inject function
 */
@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="chat-list-container">
      <!-- Header Section -->
      <header class="chat-header">
        <div class="header-content">
          <div class="header-icon">
            <lucide-angular [img]="MessageCircle" class="icon-lg"></lucide-angular>
          </div>
          <div class="header-text">
            <h1>Messages</h1>
            <p class="subtitle">
              @if (isOwner()) {
                Property inquiries from customers
              } @else {
                Your property conversations
              }
            </p>
          </div>
        </div>
        
        <!-- Connection Status Badge -->
        <div class="connection-badge" [class.connected]="chatService.isConnected()">
          <span class="status-dot"></span>
          <span class="status-text">
            {{ chatService.connectionStatus() === 'connected' ? 'Live' : 'Offline' }}
          </span>
        </div>
      </header>

      <!-- Search Bar -->
      <div class="search-section">
        <div class="search-wrapper">
          <lucide-angular [img]="Search" class="search-icon"></lucide-angular>
          <input 
            type="text" 
            placeholder="Search conversations..." 
            class="search-input"
            (input)="onSearchChange($event)"
          />
        </div>
      </div>

      <!-- Chat Threads List -->
      <main class="threads-container">
        @if (loading()) {
          <!-- Loading Skeleton -->
          <div class="loading-skeleton">
            @for (item of [1,2,3]; track item) {
              <div class="skeleton-item">
                <div class="skeleton-avatar"></div>
                <div class="skeleton-content">
                  <div class="skeleton-line short"></div>
                  <div class="skeleton-line long"></div>
                </div>
              </div>
            }
          </div>
        } @else if (filteredThreads().length === 0) {
          <!-- Empty State -->
          <div class="empty-state">
            <div class="empty-icon-wrapper">
              <lucide-angular [img]="MessageCircle" class="empty-icon"></lucide-angular>
            </div>
            <h3>No conversations yet</h3>
            <p>
              @if (isOwner()) {
                When customers book your properties, you'll see their messages here.
              } @else {
                Start a conversation by booking a property!
              }
            </p>
          </div>
        } @else {
          <!-- Thread List -->
          <div class="threads-list">
            @for (thread of filteredThreads(); track thread.propertyId + thread.customerId) {
              <div 
                class="thread-card" 
                [class.has-unread]="thread.unreadCount > 0"
                (click)="openChat(thread)"
              >
                <!-- Property Image -->
                <div class="thread-avatar">
                  @if (thread.propertyImage) {
                    <img 
                      [src]="getImageUrl(thread.propertyImage)" 
                      [alt]="thread.propertyTitle"
                      class="avatar-img"
                    />
                  } @else {
                    <div class="avatar-placeholder">
                      <lucide-angular [img]="Home" class="placeholder-icon"></lucide-angular>
                    </div>
                  }
                </div>

                <!-- Thread Content -->
                <div class="thread-content">
                  <div class="thread-header">
                    <h4 class="thread-title">{{ thread.propertyTitle }}</h4>
                    <span class="thread-time">{{ formatTime(thread.lastMessageDate) }}</span>
                  </div>
                  
                  <div class="thread-meta">
                    <lucide-angular [img]="User" class="meta-icon"></lucide-angular>
                    <span class="customer-name">{{ thread.customerName }}</span>
                  </div>
                  
                  <p class="thread-preview">{{ thread.lastMessage }}</p>
                </div>

                <!-- Unread Badge & Arrow -->
                <div class="thread-actions">
                  @if (thread.unreadCount > 0) {
                    <span class="unread-badge">{{ thread.unreadCount }}</span>
                  }
                  <lucide-angular [img]="ChevronRight" class="arrow-icon"></lucide-angular>
                </div>
              </div>
            }
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    .chat-list-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 50%, #1e1e2e 100%);
      padding: 1.5rem;
    }

    /* Header Styles */
    .chat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px);
      border-radius: 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 1.5rem;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-icon {
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 1rem;
      background: linear-gradient(135deg, #d4af37 0%, #f4c542 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 32px rgba(212, 175, 55, 0.3);
    }

    .icon-lg {
      width: 1.5rem;
      height: 1.5rem;
      color: white;
    }

    .header-text h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: white;
      margin: 0;
    }

    .subtitle {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.6);
      margin: 0.25rem 0 0;
    }

    .connection-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2rem;
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .connection-badge.connected {
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
    }

    .status-dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: #ef4444;
      animation: pulse 2s infinite;
    }

    .connected .status-dot {
      background: #22c55e;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* Search Section */
    .search-section {
      margin-bottom: 1.5rem;
    }

    .search-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 1.25rem;
      width: 1.25rem;
      height: 1.25rem;
      color: rgba(255, 255, 255, 0.4);
    }

    .search-input {
      width: 100%;
      padding: 1rem 1rem 1rem 3.5rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 1rem;
      color: white;
      font-size: 0.95rem;
      transition: all 0.3s ease;
    }

    .search-input::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }

    .search-input:focus {
      outline: none;
      background: rgba(255, 255, 255, 0.12);
      border-color: #d4af37;
      box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.1);
    }

    /* Threads Container */
    .threads-container {
      background: rgba(255, 255, 255, 0.03);
      border-radius: 1.5rem;
      padding: 1rem;
      min-height: 60vh;
    }

    /* Loading Skeleton */
    .loading-skeleton {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .skeleton-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 1rem;
    }

    .skeleton-avatar {
      width: 4rem;
      height: 4rem;
      border-radius: 1rem;
      background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .skeleton-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .skeleton-line {
      height: 0.875rem;
      border-radius: 0.25rem;
      background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .skeleton-line.short { width: 40%; }
    .skeleton-line.long { width: 80%; }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
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

    .empty-state h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: white;
      margin: 0 0 0.5rem;
    }

    .empty-state p {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.5);
      max-width: 300px;
      margin: 0;
    }

    /* Thread List */
    .threads-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    /* Thread Card */
    .thread-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid transparent;
      border-radius: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .thread-card:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(212, 175, 55, 0.3);
      transform: translateX(4px);
    }

    .thread-card.has-unread {
      background: rgba(212, 175, 55, 0.1);
      border-color: rgba(212, 175, 55, 0.2);
    }

    /* Thread Avatar */
    .thread-avatar {
      flex-shrink: 0;
      width: 4rem;
      height: 4rem;
      border-radius: 1rem;
      overflow: hidden;
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #3b3b5c 0%, #4a4a6a 100%);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .placeholder-icon {
      width: 1.5rem;
      height: 1.5rem;
      color: rgba(255, 255, 255, 0.4);
    }

    /* Thread Content */
    .thread-content {
      flex: 1;
      min-width: 0;
    }

    .thread-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;
    }

    .thread-title {
      font-size: 1rem;
      font-weight: 600;
      color: white;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .thread-time {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
      flex-shrink: 0;
    }

    .thread-meta {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      margin-bottom: 0.375rem;
    }

    .meta-icon {
      width: 0.875rem;
      height: 0.875rem;
      color: #d4af37;
    }

    .customer-name {
      font-size: 0.8125rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .thread-preview {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.5);
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .has-unread .thread-preview {
      color: rgba(255, 255, 255, 0.8);
      font-weight: 500;
    }

    /* Thread Actions */
    .thread-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-shrink: 0;
    }

    .unread-badge {
      min-width: 1.5rem;
      height: 1.5rem;
      padding: 0 0.5rem;
      background: linear-gradient(135deg, #d4af37 0%, #f4c542 100%);
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: #1e1e2e;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .arrow-icon {
      width: 1.25rem;
      height: 1.25rem;
      color: rgba(255, 255, 255, 0.3);
      transition: all 0.3s ease;
    }

    .thread-card:hover .arrow-icon {
      color: #d4af37;
      transform: translateX(4px);
    }

    /* Responsive */
    @media (max-width: 640px) {
      .chat-list-container {
        padding: 1rem;
      }

      .chat-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .header-text h1 {
        font-size: 1.5rem;
      }

      .thread-avatar {
        width: 3rem;
        height: 3rem;
      }
    }
  `]
})
export class ChatListComponent implements OnInit, OnDestroy {
  readonly chatService = inject(CustomerPropertyChatService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Lucide icons
  readonly MessageCircle = MessageCircle;
  readonly Search = Search;
  readonly User = User;
  readonly Home = Home;
  readonly Clock = Clock;
  readonly ChevronRight = ChevronRight;

  // Component state
  readonly loading = signal(true);
  readonly searchQuery = signal('');
  readonly isOwner = signal(false);

  // Computed filtered threads
  readonly filteredThreads = computed(() => {
    const threads = this.chatService.chatThreads();
    const query = this.searchQuery().toLowerCase();

    if (!query) return threads;

    return threads.filter(t =>
      t.propertyTitle.toLowerCase().includes(query) ||
      t.customerName.toLowerCase().includes(query) ||
      t.lastMessage.toLowerCase().includes(query)
    );
  });

  ngOnInit(): void {
    // Determine user role
    const role = this.authService.userRole;
    this.isOwner.set(role === 'PropertyOwner');

    // Start SignalR connection
    this.chatService.startConnection();

    // Load appropriate chats based on role
    this.loadChats();
  }

  ngOnDestroy(): void {
    // Don't stop connection here as it might be used by other components
    // The service manages its own lifecycle
  }

  private loadChats(): void {
    this.loading.set(true);

    if (this.isOwner()) {
      this.chatService.loadOwnerChats();
    } else {
      this.chatService.loadMyChats();
    }

    // Simulated delay for loading state demonstration
    setTimeout(() => this.loading.set(false), 500);
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  openChat(thread: ChatThreadDto): void {
    this.router.navigate(['/dashboard/chat', thread.propertyId, thread.customerId]);
  }

  getImageUrl(path: string | null): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${environment.assetsBaseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  formatTime(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }
}
