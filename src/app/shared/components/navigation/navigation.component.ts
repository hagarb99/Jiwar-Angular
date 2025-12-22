import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav class="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border transition-smooth">
      <div class="container mx-auto px-4 h-20 flex items-center justify-between">
        <a routerLink="/" class="text-2xl font-bold text-primary flex items-center gap-2">
          <span class="text-gradient-gold">Smart</span> Real Estate
        </a>
        
        <div class="hidden md:flex items-center gap-8">
          <a routerLink="/" class="text-sm font-medium hover:text-accent transition-smooth">Properties</a>
          <a routerLink="/" class="text-sm font-medium hover:text-accent transition-smooth">Values</a>
          <a routerLink="/" class="text-sm font-medium hover:text-accent transition-smooth">Insights</a>
          <a routerLink="/login" class="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:shadow-luxury transition-smooth">Sign In</a>
        </div>
        
        <button class="md:hidden p-2 text-primary">
          <i class="pi pi-bars text-xl"></i>
        </button>
      </div>
    </nav>
  `,
  styles: []
})
export class NavigationComponent { }
