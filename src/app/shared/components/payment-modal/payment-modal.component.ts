import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafePipe } from '../../pipes/safe.pipe';

@Component({
    selector: 'app-payment-modal',
    standalone: true,
    imports: [CommonModule, SafePipe],
    template: `
    <div *ngIf="visible" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" (click)="onClose.emit()"></div>
      
      <!-- Modal Content -->
      <div class="relative bg-[#020817] w-full max-w-4xl h-[85vh] rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col animate-fade-in">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-white/10">
          <h2 class="text-xl font-bold text-white flex items-center">
            <i class="pi pi-shield text-[#D4AF37] mr-3"></i>
            Secure Payment
          </h2>
          <button (click)="onClose.emit()" class="p-2 hover:bg-white/10 rounded-full transition-colors">
            <i class="pi pi-times text-gray-400"></i>
          </button>
        </div>

        <!-- iframe container -->
        <div class="flex-grow relative bg-white">
          <div *ngIf="loading" class="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div class="flex flex-col items-center">
              <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4AF37]"></div>
              <p class="mt-4 text-slate-900 font-medium">Securing connection...</p>
            </div>
          </div>
          
          <iframe 
            [src]="iframeUrl | safe" 
            class="w-full h-full border-none"
            (load)="loading = false">
          </iframe>
        </div>

        <!-- Footer Info -->
        <div class="p-4 bg-slate-900/50 backdrop-blur-md text-center">
          <p class="text-[10px] text-gray-400 uppercase tracking-widest flex items-center justify-center">
            <i class="pi pi-lock mr-2"></i>
            Processed securely by Paymob • Do not close this window until redirection
          </p>
        </div>
      </div>
    </div>
  `,
    styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out forwards;
    }
  `]
})
export class PaymentModalComponent {
    @Input() visible: boolean = false;
    @Input() iframeUrl: string = '';
    @Output() onClose = new EventEmitter<void>();

    loading: boolean = true;
}
