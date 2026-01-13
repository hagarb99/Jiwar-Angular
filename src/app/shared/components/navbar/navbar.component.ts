import { Component, OnInit, OnDestroy, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import {
  LucideAngularModule,
  ChevronDown,
  Menu,
  X,
  Globe,
  Heart,
  Bell,
  MessageSquare
} from 'lucide-angular';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { ChatService } from '../../../core/services/chat.service';
import { NotificationService, NotificationDto } from '../../../core/services/notification.service';
import { DesignRequestService } from '../../../core/services/design-request.service';
import { DesignerProposalService } from '../../../core/services/designer-proposal.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    LucideAngularModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  toggleUserDropdown = false;
  currentUserRole: string | null = null;
  profilePicUrl: string | null = null;
  currentUserName: string | null = null;
  currentUserEmail: string | null = null;

  readonly ChevronDown = ChevronDown;
  readonly Menu = Menu;
  readonly X = X;
  readonly Globe = Globe;
  readonly Heart = Heart;
  readonly Bell = Bell;
  readonly MessageSquare = MessageSquare;

  // Message State
  unreadMessageCount = 0;
  toggleMessagesDropdown = false;
  conversations: any[] = [];
  loadingMessages = false;

  // Notification State
  toggleNotificationsDropdown = false;
  notifications: NotificationDto[] = [];
  unreadCount = 0;

  // State
  mobileMenuOpen = false;
  activeDropdown: 'buy' | 'invest' | 'sell' | 'renovation' | null = null;
  language: 'EN' | 'AR' = 'EN';
  currentPath = '';
  isLoggedIn = false;

  buyDropdownItems = [
    { path: '/properties', label: 'Apartments for Sale' },
    { path: '/properties?type=rent', label: 'Apartments for Rent' },
    { path: '/properties?type=new', label: 'New Developments' },
    { path: '/properties?type=virtual', label: 'Virtual Tour Properties (360°)' },
    { path: '/comparison', label: 'Compare Properties' },
    { path: '/properties?featured=true', label: 'Featured Properties' }
  ];

  investDropdownItems = [
    { path: '/investment', label: 'Investment Opportunities' },
    { path: '/calculator', label: 'ROI Calculator' },
    { path: '/investment#plans', label: 'Investment Plans' },
    { path: '/analytics', label: 'Market Insights' }
  ];

  renovationDropdownItems = [
    { path: '/renovation/intro', label: 'Start Simulation' },
    { path: '/renovation/intro', label: 'Upload Apartment Media' },
    { path: '/renovation/intro', label: 'View Recommendations' }
  ];

  sellDropdownItems = [
    { path: '/add-property', label: 'Sell Your Property' },
    { path: '/sell/rental', label: 'Rent Property' }
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private chatService: ChatService,
    private notificationService: NotificationService,
    private designRequestService: DesignRequestService,
    private proposalService: DesignerProposalService,
    private messageService: MessageService,
    private zone: NgZone
  ) {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(event => {
        this.currentPath = (event as NavigationEnd).urlAfterRedirects;
      });
  }

  ngOnInit(): void {
    // Subscribe to auth state
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUserRole = user?.role ?? null;

        if (user) {
          this.profilePicUrl = user.profilePicURL || null;
          this.currentUserName = user.name || null;
          this.currentUserEmail = user.email || null;
          this.isLoggedIn = true;

          // Initialize SignalR connections with token
          const token = localStorage.getItem('token');
          if (token) {
            this.notificationService.startConnection(token);
            this.chatService.startConnection(token); // Start ChatHub globally
            this.chatService.getTotalUnreadCount().subscribe(); // Fetch initial total unread count
          }
        } else {
          this.profilePicUrl = null;
          this.currentUserName = null;
          this.currentUserEmail = null;
          this.isLoggedIn = false;
          this.notificationService.stopConnection();
        }
      });

    // Subscribe to login status
    this.authService.isLoggedIn$
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.isLoggedIn = status;
      });

    // Subscribe to notifications (Filter out 'Chat' type from bell list)
    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        this.notifications = notifications.filter(n => n.notificationType?.toLowerCase() !== 'chat' && n.notificationType !== 'Chat');
      });

    // Subscribe to unread count
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadCount = count;
      });

    // Subscribe to unread messages count
    this.chatService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        // This count is updated by loadConversations (API) OR individual message updates
        this.unreadMessageCount = count;
      });

    // Refresh conversation list when a new message arrives real-time
    this.chatService.messageReceived$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Conversation metadata might have changed (last message, unread count per item)
        this.loadConversations();
      });

    // Also refresh on notifications (since chat notifications also come through there)
    this.notificationService.refresh$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadConversations();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setDropdown(name: 'buy' | 'invest' | 'sell' | 'renovation' | null): void {
    this.activeDropdown = name;
  }

  toggleLanguage(): void {
    this.language = this.language === 'EN' ? 'AR' : 'EN';
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  logout(): void {
    this.notificationService.stopConnection();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToDashboard(): void {
    if (!this.currentUserRole) {
      return;
    }

    if (this.currentUserRole === 'PropertyOwner') {
      this.router.navigate(['/dashboard/propertyowner/dashboard']);
    }

    if (this.currentUserRole === 'InteriorDesigner') {
      this.router.navigate(['/dashboard/designer/dashboard']);
    }

    if (this.currentUserRole === 'Admin') {
      this.router.navigate(['/dashboard/admin']);
    }
    if (this.currentUserRole === 'Customer') {
      this.router.navigate(['/dashboard']);
    }
  }

  toggleNotifications(): void {
    this.toggleNotificationsDropdown = !this.toggleNotificationsDropdown;
    if (this.toggleNotificationsDropdown) {
      this.toggleUserDropdown = false;
      this.toggleMessagesDropdown = false;
      // Load notifications (backend auto-marks as read)
      this.notificationService.loadNotifications().subscribe();
    }
  }

  markAllAsRead(): void {
    // Backend now auto-marks as read when fetching
    // This method is kept for backwards compatibility but does nothing
    console.log('Notifications are auto-marked as read by backend');
  }

  onNotificationClick(notification: NotificationDto): void {
    // Backend auto-marks as read, no need for manual call
    // Close dropdown
    this.toggleNotificationsDropdown = false;

    // Navigate based on notification content
    const msg = notification.message.toLowerCase();
    const idMatch = notification.message.match(/\d+/);

    if (idMatch) {
      const id = idMatch[0];

      if (this.currentUserRole === 'PropertyOwner') {
        // If project delivered, go to workspace and trigger review modal
        if (msg.includes('delivered') || msg.includes('completed')) {
          this.router.navigate(['/dashboard/workspace', id], { queryParams: { openReview: 'true' } });
        } else {
          // Default: Go to request details for new proposals etc.
          this.router.navigate(['/dashboard/propertyowner/design-requests', id]);
        }
      } else if (this.currentUserRole === 'InteriorDesigner') {
        // Designer redirection logic
        if (msg.includes('review') || msg.includes('star')) {
          this.router.navigate(['/dashboard/designer/reviews']);
        } else if (msg.includes('accepted') || msg.includes('workspace') || msg.includes('chat')) {
          this.router.navigate(['/dashboard/workspace', id]);
        } else {
          this.router.navigate(['/dashboard/designer/my-proposals']);
        }
      }
    } else {
      // If no ID but message is about review, go to reviews page
      if (this.currentUserRole === 'InteriorDesigner' && (msg.includes('review') || msg.includes('star'))) {
        this.router.navigate(['/dashboard/designer/reviews']);
      } else {
        this.goToDashboard();
      }
    }
  }

  toggleMessages(): void {
    this.toggleMessagesDropdown = !this.toggleMessagesDropdown;
    if (this.toggleMessagesDropdown) {
      this.toggleNotificationsDropdown = false; // Close other dropdown
      this.toggleUserDropdown = false;
      this.loadConversations();
    }
  }

  loadConversations(): void {
    if (!this.isLoggedIn) return;
    this.loadingMessages = true;
    if (this.currentUserRole === 'PropertyOwner') {
      this.designRequestService.getMyDesignRequests().subscribe({
        next: (requests) => {
          this.conversations = requests
            .filter(r => r.status !== 'Pending' && r.status !== 'New')
            .map(r => ({
              id: r.id,
              propertyId: r.propertyID,
              title: r.preferredStyle ? `${r.preferredStyle} Design` : `Project #${r.id}`,
              subtitle: (r as any).lastMessage || `Status: ${r.status}`,
              image: null,
              time: new Date(r.createdAt || new Date()),
              type: 'request',
              unreadCount: (r as any).unreadCount || 0
            }))
            .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

          this.calculateTotalUnread();
          this.loadingMessages = false;
        },
        error: () => this.loadingMessages = false
      });
    } else if (this.currentUserRole === 'InteriorDesigner') {
      this.proposalService.getMyProposals().subscribe({
        next: (proposals) => {
          this.conversations = proposals
            .filter(p => p.status === 1 || p.status === 3)
            .map(p => {
              const requestId = p.designRequestID || (p as any).designRequestId || (p as any).requestId || (p as any).id;
              return {
                id: requestId,
                propertyId: (p as any).propertyID || (p as any).propertyId || requestId, // Fallback to requestId if propertyId missing
                title: `Project #${requestId}`,
                subtitle: (p as any).lastMessage || p.proposalDescription || 'Active Project',
                image: p.sampleDesignURL,
                time: new Date(),
                type: 'proposal',
                unreadCount: (p as any).unreadCount || 0
              };
            });

          this.calculateTotalUnread();
          this.loadingMessages = false;
        },
        error: () => this.loadingMessages = false
      });
    } else {
      this.loadingMessages = false;
    }
  }

  private calculateTotalUnread(): void {
    const total = this.conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
    this.unreadMessageCount = total;
  }

  onMessageClick(item: any): void {
    this.toggleMessagesDropdown = false;
    if (!item.id) {
      console.error('Invalid Project ID');
      return;
    }

    // 1. Optimistically update local state immediately
    item.unreadCount = 0;
    this.calculateTotalUnread();

    // 2. Navigate to workspace (backend will auto-mark as read)
    this.router.navigate(['/dashboard/workspace', item.id]);
  }

  goToMessages(): void {
    this.toggleMessagesDropdown = false;
    this.router.navigate(['/dashboard/messages']);
  }
}
