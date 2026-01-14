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
import { environment } from '../../../../environments/environment';
import { DesignRequestService } from '../../../core/services/design-request.service';
import { DesignerProposalService } from '../../../core/services/designer-proposal.service';
import { GlobalMessagesService, ChatNotification } from '../../../core/services/global-messages.service';

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

  // 🟢 Global Message State
  private globalMessagesService = inject(GlobalMessagesService);
  unreadMessageCount$ = this.globalMessagesService.unreadCount$;
  latestMessages$ = this.globalMessagesService.latestMessages$;
  toggleMessagesDropdown = false;

  // Kept for backward compatibility / reference if needed, but primary logic moves to GlobalMessagesService
  loadingMessages = false;
  conversations: any[] = [];

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
  isDarkBgPage = false;

  buyDropdownItems = [
    { path: '/properties', label: 'Apartments for Sale' },
    { path: '/comparison', label: 'Compare Properties' },
  ];

  renovationDropdownItems = [
    { path: '/renovation/intro', label: 'Start Simulation' }
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
        const url = (event as NavigationEnd).urlAfterRedirects;
        this.currentPath = url;
        this.isDarkBgPage = ['/', '/home', '/add-property'].includes(url);
      });
  }

  ngOnInit(): void {
    // Initial check
    this.isDarkBgPage = ['/', '/home', '/add-property'].includes(this.router.url);

    // Subscribe to auth state
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUserRole = user?.role ?? null;

        if (user) {
          this.profilePicUrl = this.getAbsoluteUrl(user.profilePicURL);
          this.currentUserName = user.name || null;
          this.currentUserEmail = user.email || null;
          this.isLoggedIn = true;

          // Initialize SignalR connections with token
          const token = localStorage.getItem('token');
          if (token) {
            this.notificationService.startConnection(token);
            // GlobalMessagesService auto-initializes in its constructor, 
            // but we ensure it's loaded by injecting it.
            this.globalMessagesService.loadInitialUnreadCount();
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

    // Subscribe to general notification unread count
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadCount = count;
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
      this.router.navigate(['/dashboard/customer/dashboard']);
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
    console.log('Notifications are auto-marked as read by backend');
  }

  onNotificationClick(notification: NotificationDto): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.notificationID).subscribe({
        next: () => console.log('Notification marked as read'),
        error: (err) => console.error('Error marking notification as read:', err)
      });
    }

    this.toggleNotificationsDropdown = false;
    const message = notification.message.toLowerCase();
    const requestMatch = notification.message.match(/design request (\d+)/i) || notification.message.match(/request (\d+)/i);
    const bookingMatch = notification.message.match(/booking.*(\d+)/i);
    const idMatch = notification.message.match(/\d+/); // Fallback

    const requestId = requestMatch ? requestMatch[1] : (idMatch ? idMatch[0] : null);
    const bookingId = bookingMatch ? bookingMatch[1] : null;

    if (this.currentUserRole === 'PropertyOwner') {
      if (bookingId || notification.notificationType?.toLowerCase().includes('booking') || message.includes('booking')) {
        this.router.navigate(['/dashboard/propertyowner/owner-bookings']);
      } else if (requestId) {
        this.router.navigate(['/dashboard/propertyowner/design-requests', requestId]);
      } else {
        this.router.navigate(['/dashboard/propertyowner/my-requests']);
      }
    }
    else if (this.currentUserRole === 'InteriorDesigner') {
      if (message.includes('accepted') || message.includes('approved')) {
        this.router.navigate(['/dashboard/designer/active-projects']);
      } else if (requestId) {
        this.router.navigate(['/dashboard/designer/my-proposals']);
      } else {
        this.router.navigate(['/dashboard/designer/available-projects']);
      }
    }
    else if (this.currentUserRole === 'Customer') {
      if (message.includes('booking')) {
        this.router.navigate(['/dashboard/customer/my-bookings']);
      } else {
        this.router.navigate(['/dashboard/customer/dashboard']);
      }
    }
  }

  private getAbsoluteUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const base = environment.apiBaseUrl.replace(/\/api\/?$/, '');
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  toggleMessages(): void {
    this.toggleMessagesDropdown = !this.toggleMessagesDropdown;
    if (this.toggleMessagesDropdown) {
      this.toggleNotificationsDropdown = false;
      this.toggleUserDropdown = false;
      this.globalMessagesService.loadInitialUnreadCount();
      // this.loadConversations(); // Optional: if we wanted to fetch old conversations
    }
  }

  // Updated to handle ChatNotification from GlobalMessagesService
  onMessageClick(notification: ChatNotification): void {
    this.toggleMessagesDropdown = false;

    // Navigate to valid workspace
    // Logic depends on 'type' or context
    if (notification.type === 'Chat') {
      // Assuming relatedId is RequestID for Designer Chat
      // Or if checking roles
      if (this.currentUserRole === 'InteriorDesigner' || this.currentUserRole === 'PropertyOwner') {
        this.router.navigate(['/dashboard/workspace', notification.relatedId]);
      }
      // If it's a Property Chat (Customer <-> Owner)
      // notification.relatedId might be propertyId or room name
      // Logic needs to adapt if type differs
    } else {
      // Fallback navigation
      this.router.navigate(['/dashboard/messages']);
    }

    // Mark Read Logic
    this.globalMessagesService.markAsRead(notification.relatedId);
  }

  onViewAll(): void {
    this.router.navigate(['/dashboard/messages']);
  }

  goToMessages(): void {
    this.toggleMessagesDropdown = false;
    this.router.navigate(['/dashboard/messages']);
  }
}
