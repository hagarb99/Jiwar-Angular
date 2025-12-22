import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="bg-primary text-white py-12 border-t border-white/10">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div class="col-span-1 md:col-span-2 space-y-4">
            <h3 class="text-2xl font-bold"><span class="text-gradient-gold">Smart</span> Real Estate</h3>
            <p class="text-white/60 max-w-md">
              The next generation of real estate intelligence. Powered by AI to help you make smarter decisions.
            </p>
          </div>
          <div>
            <h4 class="font-bold mb-4">Quick Links</h4>
            <ul class="space-y-2 text-white/60">
              <li><a href="#" class="hover:text-accent transition-smooth">Properties</a></li>
              <li><a href="#" class="hover:text-accent transition-smooth">Valuations</a></li>
              <li><a href="#" class="hover:text-accent transition-smooth">Insights</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-bold mb-4">Contact</h4>
            <ul class="space-y-2 text-white/60">
              <li>info&#64;smartrealestate.com</li>
              <li>+1 (555) 000-0000</li>
            </ul>
          </div>
        </div>
        <div class="mt-12 pt-8 border-t border-white/10 text-center text-white/40 text-sm">
          &copy; {{ currentYear }} Smart Real Estate. All rights reserved.
        </div>
      </div>
    </footer>
  `,
  styles: []
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
