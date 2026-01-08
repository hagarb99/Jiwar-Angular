import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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

  ngOnInit() {
    // Trigger auth state restoration from localStorage
    // This ensures currentUser$ emits the stored user data
    this.authService.currentUser$.subscribe();
  }
}