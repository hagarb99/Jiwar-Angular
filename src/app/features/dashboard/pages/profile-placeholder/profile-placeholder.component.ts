import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-profile-placeholder',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="p-6">
      <div class="bg-white rounded-lg shadow-sm p-8 text-center">
        <div class="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">My Profile</h1>
        <p class="text-gray-600">The profile management feature is coming soon.</p>
      </div>
    </div>
  `
})
export class ProfilePlaceholderComponent { }
