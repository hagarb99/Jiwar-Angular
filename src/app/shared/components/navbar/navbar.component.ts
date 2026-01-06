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
          this.profilePicUrl = user.profilePicURL || null;
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
      this.router.navigate(['/dashboard/interiordesigner/dashboard']);
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
        next: () => {
          console.log('Notification marked as read');
        },
        error: (err) => {
          console.error('Error marking notification as read:', err);
        }
      });
    }

    // Close dropdown
    this.toggleNotificationsDropdown = false;

    // --- Navigation Logic ---
    const message = notification.message.toLowerCase();
    const requestMatch = notification.message.match(/design request (\d+)/i);
    const requestId = requestMatch ? requestMatch[1] : null;

    if (this.currentUserRole === 'PropertyOwner') {
      if (requestId) {
        this.router.navigate(['/dashboard/propertyowner/design-requests', requestId]);
      } else {
        this.router.navigate(['/dashboard/propertyowner/my-requests']);
      }
    }
    else if (this.currentUserRole === 'InteriorDesigner') {
      if (message.includes('accepted') || message.includes('approved')) {
        this.router.navigate(['/dashboard/designer/active-projects']);
      } else if (requestId) {
        // Find if this is an active project or just a proposal
        this.router.navigate(['/dashboard/designer/my-proposals']);
      } else {
        this.router.navigate(['/dashboard/designer/available-projects']);
      }
    }
  }
}
