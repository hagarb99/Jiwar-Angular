import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      (click)="goToDetails()"
      [class]="'group relative overflow-hidden rounded-2xl bg-white border border-gray-100 hover:shadow-2xl hover:shadow-yellow-500/10 transition-all duration-500 cursor-pointer ' + (size === 'large' ? 'md:col-span-2 md:row-span-2' : size === 'medium' ? 'md:col-span-2' : '')"
    >
      <!-- Image Container -->
      <div class="aspect-[4/3] overflow-hidden relative">
        <img 
          [src]="image || '/logo2.png'" 
          [alt]="title"
          class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <!-- Badges -->
        <div class="absolute top-4 left-4 flex gap-2">
          <span class="px-3 py-1 rounded-lg bg-white/95 backdrop-blur-sm text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider shadow-sm border border-yellow-100">
            {{ type }}
          </span>
          <span class="px-3 py-1 rounded-lg bg-[#D4AF37]/95 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
            {{ purpose }}
          </span>
        </div>
      </div>
      
      <!-- Content -->
      <div class="p-5">
        <div class="flex justify-between items-start mb-2">
            <h3 class="text-lg font-bold text-gray-900 group-hover:text-[#D4AF37] transition-colors line-clamp-1 flex-1">
            {{ title }}
            </h3>
            <p class="text-[#D4AF37] font-extrabold text-lg ml-2">{{ price }}</p>
        </div>
        
        <p class="text-gray-400 text-sm flex items-center gap-1.5">
          <svg class="w-4 h-4 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          {{ location }}
        </p>

        <div class="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
            <span class="text-xs font-bold text-gray-300 group-hover:text-[#D4AF37] transition-colors flex items-center gap-1">
                عرض التفاصيل
                <svg class="w-3 h-3 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
            </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
        :host { display: block; }
    `]
})
export class PropertyCardComponent {
  private router = inject(Router);

  @Input() id: number | undefined;
  @Input() propertyID: number | undefined;
  @Input() image: string = '';
  @Input() type: string = '';
  @Input() purpose: string = '';
  @Input() title: string = '';
  @Input() location: string = '';
  @Input() price: string = '';
  @Input() size: 'small' | 'medium' | 'large' = 'small';

  goToDetails() {
    const idToUse = this.propertyID || this.id;
    if (idToUse) {
      this.router.navigate(['/property-details', idToUse]);
    }
  }
}
