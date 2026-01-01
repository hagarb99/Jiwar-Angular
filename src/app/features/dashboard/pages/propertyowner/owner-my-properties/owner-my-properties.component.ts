import { Component , OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Property, PropertyService } from '../../../../../core/services/property.service';
import { environment } from '../../../../../../environments/environment';
@Component({
  selector: 'app-owner-my-properties',
   standalone: true,
  imports: [CommonModule],
  templateUrl: './owner-my-properties.component.html',
  styleUrls: ['./owner-my-properties.component.css']
})
export class OwnerMyPropertiesComponent implements OnInit {
    properties: Property[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  
  constructor(private propertyService: PropertyService) {}
  
  
  ngOnInit(): void {
    this.loadMyProperties();
  }
 
 getThumbnailUrl(property: Property): string {
  const fallbackImage = '/logo2.png';

  if (!property) {
    return fallbackImage;
  }

  // Case 1: backend sends thumbnailUrl
  if (property.thumbnailUrl) {
    return property.thumbnailUrl.startsWith('/')
      ? environment.assetsBaseUrl + property.thumbnailUrl
      : property.thumbnailUrl;
  }

  // Case 2: use first property media
  if (property.propertyMedia?.length) {
    const media = property.propertyMedia
      .filter(mediaItem => !mediaItem.isDeleted)
      .sort((first, second) => first.order - second.order)[0];

    if (media?.mediaURL) {
      return media.mediaURL.startsWith('/')
        ? environment.assetsBaseUrl + media.mediaURL
        : media.mediaURL;
    }
  }

  return fallbackImage;
}

 
  private loadMyProperties(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.propertyService.getMyProperties().subscribe({
      next: (data) => {
        this.properties = data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load your properties';
        this.isLoading = false;
      }
    });
  }

}


