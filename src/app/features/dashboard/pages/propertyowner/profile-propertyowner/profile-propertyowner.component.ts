import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProfileService, PropertyOwnerProfile } from '../profile.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-profile-propertyowner',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastModule],
  providers: [MessageService],
  templateUrl: './profile-propertyowner.component.html',
  styleUrls: ['./profile-propertyowner.component.css']
})
export class ProfilePropertyownerComponent implements OnInit {
  profile: PropertyOwnerProfile | null = null;
  loading = true;

  constructor(
    private profileService: ProfileService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.loading = true;
    this.profileService.getProfile().subscribe({
      next: (data) => {
        this.profile = data;
        this.loading = false;

        // Mock stats if not present (since backend might not return them yet)
        if (!this.profile.stats) {
          this.profile.stats = [
            { label: 'Properties', value: '12' },
            { label: 'Total Revenue', value: '$48.5k' },
            { label: 'Review Score', value: '4.8' },
            { label: 'Years Active', value: '5' }
          ];
        }
      },
      error: (err) => {
        console.error('Error fetching profile', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load profile data' });
        this.loading = false;
      }
    });
  }
}
