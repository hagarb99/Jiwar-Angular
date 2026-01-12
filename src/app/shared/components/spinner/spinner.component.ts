import { Component } from '@angular/core';
import { LoadingService } from '../../../core/services/loading.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
<div *ngIf="loadingService.loading$ | async" class="spinner-overlay">
  <div class="jiwar-loader">
    <span>J</span>
    <span>I</span>
    <span>W</span>
    <span>A</span>
    <span>R</span>
  </div>
</div>

  `,
  styleUrls: ['spinner.component.css']
})
export class SpinnerComponent {
  constructor(public loadingService: LoadingService) { }
}
