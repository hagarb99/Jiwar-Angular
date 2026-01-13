import { Component, OnInit, OnDestroy } from '@angular/core';
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
  Bell
} from 'lucide-angular';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService, NotificationDto } from '../../../core/services/notification.service';
import { environment } from '../../../../environments/environment';

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
    { path: '/comparison', label: 'Compare Properties' },
  ];

  // investDropdownItems = [
  //   { path: '/investment', label: 'Investment Opportunities' },
  //   { path: '/calculator', label: 'ROI Calculator' },
  //   { path: '/investment#plans', label: 'Investment Plans' },
  //   { path: '/analytics', label: 'Market Insights' }
  // ];

  renovationDropdownItems = [
    { path: '/renovation/intro', label: 'Start Simulation' }
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService
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
          this.profilePicUrl = this.getAbsoluteUrl(user.profilePicURL);
          this.currentUserName = user.name || null;
          this.currentUserEmail = user.email || null;
          this.isLoggedIn = true;

          // Initialize SignalR connection with token
          const token = localStorage.getItem('token');
          if (token) {
            this.notificationService.startConnection(token);
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

    // Subscribe to notifications
    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        this.notifications = notifications;
      });

    // Subscribe to unread count
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
      this.router.navigate(['/dashboard']);
    }
  }

  toggleNotifications(): void {
    this.toggleNotificationsDropdown = !this.toggleNotificationsDropdown;
    if (this.toggleNotificationsDropdown) {
      this.toggleUserDropdown = false; // Close user dropdown
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        console.log('All notifications marked as read');
      },
      error: (err) => {
        console.error('Error marking all as read:', err);
      }
    });
  }

  onNotificationClick(notification: NotificationDto): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.notificationID).subscribe({
        next: () => console.log('Notification marked as read'),
        error: (err) => console.error('Error marking notification as read:', err)
      });
    }

    // Close dropdown
    this.toggleNotificationsDropdown = false;

    // Parse notification content
    const message = notification.message.toLowerCase();
    const requestMatch = notification.message.match(/design request (\d+)/i) || notification.message.match(/request (\d+)/i);
    const bookingMatch = notification.message.match(/booking.*(\d+)/i);
    const idMatch = notification.message.match(/\d+/);

    // Prefer specific matches, fallback to generic number find
    const requestId = requestMatch ? requestMatch[1] : (idMatch ? idMatch[0] : null);
    const bookingId = bookingMatch ? bookingMatch[1] : null;

    console.log('🔗 Navigation logic triggered:', {
      role: this.currentUserRole,
      type: notification.notificationType,
      requestId,
      bookingId
    });

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
        // If it looks like a new specific request/proposal
        this.router.navigate(['/dashboard/designer/my-proposals']);
      } else {
        this.router.navigate(['/dashboard/designer/available-projects']);
      }
    }
    else if (this.currentUserRole === 'Customer') {
      if (message.includes('booking')) {
        this.router.navigate(['/dashboard/customer/my-bookings']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    }
  }

  private getAbsoluteUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const base = environment.apiBaseUrl.replace(/\/api\/?$/, '');
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  }
}
