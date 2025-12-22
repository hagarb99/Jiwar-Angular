import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-property-card',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div 
      [class]="'group relative overflow-hidden rounded-2xl bg-card border border-border hover-gold transition-smooth ' + (size === 'large' ? 'md:col-span-2 md:row-span-2' : size === 'medium' ? 'md:col-span-2' : '')"
    >
      <div class="aspect-[4/3] overflow-hidden">
        <img 
          [src]="image" 
          [alt]="title"
          class="h-full w-full object-cover transition-smooth group-hover:scale-110"
        />
      </div>
      
      <div class="absolute top-4 left-4 flex gap-2">
        <span class="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-primary text-xs font-bold uppercase tracking-wider">
          {{ type }}
        </span>
        <span class="px-3 py-1 rounded-full bg-accent/90 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider">
          {{ purpose }}
        </span>
      </div>
      
      <div class="p-6">
        <p class="text-accent font-bold text-xl mb-1">{{ price }}</p>
        <h3 class="text-lg font-bold text-primary group-hover:text-accent transition-smooth line-clamp-1">
          {{ title }}
        </h3>
        <p class="text-muted-foreground text-sm flex items-center gap-1 mt-1">
          <i class="pi pi-map-marker text-xs"></i> {{ location }}
        </p>
      </div>
    </div>
  `,
    styles: []
})
export class PropertyCardComponent {
    @Input() image: string = '';
    @Input() type: string = '';
    @Input() purpose: string = '';
    @Input() title: string = '';
    @Input() location: string = '';
    @Input() price: string = '';
    @Input() size: 'small' | 'medium' | 'large' = 'small';
}
