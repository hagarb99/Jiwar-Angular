import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';
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

  ngOnInit() {
    console.log('AppComponent initialized');

    const token = this.authService.getToken();
    console.log('Token available on app init:', !!token);

    if (token) {
      console.log('Starting SignalR connection from AppComponent');
      this.notificationService.startConnection(token).catch(err => {
        console.error('Failed to start SignalR connection:', err);
      });
    } else {
      console.log('No token available, SignalR connection not started');
    }

    // Subscribe to auth state changes to handle login/logout
    this.authService.currentUser$.subscribe(user => {
      console.log('Auth state changed:', user ? user.email : 'Logged out');

      if (user) {
        const token = this.authService.getToken();
        if (token) {
          this.notificationService.startConnection(token).catch(err => {
            console.error('Failed to restart SignalR after login:', err);
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
}