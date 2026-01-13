import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastModule],
  templateUrl: 'app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    // Trigger auth state restoration from localStorage
    // This ensures currentUser$ emits the stored user data
    this.authService.currentUser$.subscribe();
  }

  onToastClick(message: any) {
    if (message.data?.type === 'Chat' && message.data?.relatedId) {
      console.log('🔔 Toast clicked: navigating to chat', message.data.relatedId);
      this.router.navigate(['/dashboard/workspace', message.data.relatedId]);
    }
  }
}