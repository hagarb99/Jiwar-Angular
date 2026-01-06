import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, User, Scale, Heart, Shield, Settings } from 'lucide-angular';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-profile-placeholder',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="p-4 md:p-8 max-w-7xl mx-auto">
      <!-- Welcome Section -->
      <div class="mb-10">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Welcome back, {{ (currentUser$ | async)?.name || 'User' }}!</h1>
        <p class="text-gray-500">Manage your property search, favorites, and comparisons from your personal dashboard.</p>
      </div>

      <!-- Stats/Quick Actions Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer" routerLink="/compare">
          <div class="w-12 h-12 bg-yellow-50 text-[#D4AF37] rounded-xl flex items-center justify-center mb-4">
            <lucide-angular [img]="Scale" class="w-6 h-6"></lucide-angular>
          </div>
          <h3 class="font-bold text-gray-900 mb-1">Smart Compare</h3>
          <p class="text-sm text-gray-500">Analyze properties side-by-side</p>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer" routerLink="/wishlist">
          <div class="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mb-4">
            <lucide-angular [img]="Heart" class="w-6 h-6"></lucide-angular>
          </div>
          <h3 class="font-bold text-gray-900 mb-1">My Favorites</h3>
          <p class="text-sm text-gray-500">Quick access to saved homes</p>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <div class="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mb-4">
            <lucide-angular [img]="Shield" class="w-6 h-6"></lucide-angular>
          </div>
          <h3 class="font-bold text-gray-900 mb-1">Security</h3>
          <p class="text-sm text-gray-500">Account and privacy settings</p>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <div class="w-12 h-12 bg-gray-50 text-gray-500 rounded-xl flex items-center justify-center mb-4">
            <lucide-angular [img]="Settings" class="w-6 h-6"></lucide-angular>
          </div>
          <h3 class="font-bold text-gray-900 mb-1">Preferences</h3>
          <p class="text-sm text-gray-500">Matching and notifications</p>
        </div>
      </div>

      <!-- Feature Highlight Card -->
      <div class="bg-gradient-to-r from-[#1a1a1a] to-[#3a3a3a] rounded-3xl p-8 text-white relative overflow-hidden">
        <div class="max-w-md relative z-10">
          <h2 class="text-3xl font-bold mb-4">Try Our Smart Property Comparison</h2>
          <p class="text-gray-300 mb-6">Unsure which home is right for you? Our comparison tool highlights the best features and investment potential of each property you save.</p>
          <button routerLink="/compare" class="bg-[#D4AF37] hover:bg-[#C5A028] text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-yellow-500/20">
            Compare Now
          </button>
        </div>
        <lucide-angular [img]="Scale" class="absolute right-[-20px] bottom-[-40px] w-64 h-64 text-white/5 rotate-[-15deg]"></lucide-angular>
      </div>
    </div>
  `
})
export class ProfilePlaceholderComponent {
  private authService = inject(AuthService);
  currentUser$ = this.authService.currentUser$;

  // Icons
  User = User;
  Scale = Scale;
  Heart = Heart;
  Shield = Shield;
  Settings = Settings;
}
