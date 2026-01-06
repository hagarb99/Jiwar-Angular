import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PropertyOwnerService , PropertyOwnerPublicProfile} from '../../../../../../core/services/PropertyOwnerService';
import { Property, PropertyService } from '../../../../../../core/services/property.service';

@Component({
  selector: 'app-property-owner-public-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './property-owner-public-profile.component.html',
  styleUrl: './property-owner-public-profile.component.css'
})
export class PropertyOwnerPublicProfileComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly propertyOwnerService = inject(PropertyOwnerService);
  private readonly propertyService = inject(PropertyService);

  profile?: PropertyOwnerPublicProfile;
  properties: Property[] = [];
  isLoading = true;
  hasError = false;

  ngOnInit() {
    const userId = this.route.snapshot.paramMap.get('userId');
    if (!userId) {
      this.hasError = true;
      this.isLoading = false;
      return;
    }
    this.isLoading = true;

    // 1️⃣ Fetch owner profile
    this.propertyOwnerService.getPublicProfile(userId).subscribe({
      next: (profile: PropertyOwnerPublicProfile) => {
        this.profile = profile;
        this.propertyService.getFilteredProperties({}).subscribe({
          next: (allProperties) => {
            // this.properties = allProperties.filter(p => p.propertyOwner?.userId === userId);
            this.isLoading = false;
          },
          error: () => {
            this.hasError = true;
            this.isLoading = false;
          }
        });
      },
      error: () => {
        this.hasError = true;
        this.isLoading = false;
      }
    });
  }
  
}
