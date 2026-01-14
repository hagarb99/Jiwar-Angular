import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';
import { TranslationService } from './core/services/translation.service';
import { SpinnerComponent } from "./shared/components/spinner/spinner.component";
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SpinnerComponent, ToastModule],
  templateUrl: 'app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'app';
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private translationService = inject(TranslationService);


  ngOnInit() {
    console.log('AppComponent initialized');

    // Subscribe to auth state changes to handle SignalR connection start/stop
    this.authService.currentUser$.subscribe(user => {
      console.log('Auth state changed:', user ? user.email : 'Logged out');

      if (user) {
        const token = this.authService.getToken();
        if (token) {
          this.notificationService.startConnection(token).catch(err => {
            console.error('Failed to start SignalR connection:', err);
          });
        }
      } else {
        this.notificationService.stopConnection();
      }
    });
  }

  ngOnDestroy() {
    console.log('AppComponent destroyed');
    this.notificationService.stopConnection();
  }

  onToastClick(message: any) {
    if (message.data?.type === 'Chat' && message.data?.relatedId) {
      console.log('🔔 Toast clicked: navigating to chat', message.data.relatedId);
      this.router.navigate(['/dashboard/workspace', message.data.relatedId]);
    } else if (message.data?.type === 'Booking') {
      const role = this.authService.userRole;
      if (role === 'PropertyOwner') {
        this.router.navigate(['/dashboard/propertyowner/my-Booking']);
      } else if (role === 'Customer') {
        this.router.navigate(['/dashboard/customer/MyBooking']);
      }
    }
  }
}