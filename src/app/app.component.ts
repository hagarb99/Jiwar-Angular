import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ButtonModule, ToastModule],  // Add PrimeNG modules here
  template: `
    <p-button label="Show Toast" (onClick)="showToast()"></p-button>
    <p-toast></p-toast>
  `,
  styles: []
})
export class AppComponent {
  constructor(private messageService: MessageService) {}

  showToast() {
    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'PrimeNG is working!' });
  }
}