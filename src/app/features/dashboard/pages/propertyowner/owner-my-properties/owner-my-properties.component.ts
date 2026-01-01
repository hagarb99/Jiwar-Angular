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
    console.log('Property is null/undefined');
    return fallbackImage;
  }

  console.log('Property data:', {
    propertyID: property.propertyID,
    title: property.title,
    ThumbnailUrl: property.ThumbnailUrl,
    thumbnailUrl: property.thumbnailUrl
  });

  // Use ThumbnailUrl from backend (PropertyListBDTO) - similar to other working components
  if (property.ThumbnailUrl) {
    console.log('Using ThumbnailUrl:', property.ThumbnailUrl);
    // If it's already a full URL, use it
    if (property.ThumbnailUrl.startsWith('http')) {
      return property.ThumbnailUrl;
    }

    // Build full URL from relative path using API base URL (like other components)
    const apiBase = environment.apiBaseUrl;
    const cleanBase = apiBase.endsWith('/api') ? apiBase.replace('/api', '') : apiBase;
    const cleanPath = property.ThumbnailUrl.startsWith('/') ? property.ThumbnailUrl.substring(1) : property.ThumbnailUrl;
    const finalBase = cleanBase.endsWith('/') ? cleanBase.slice(0, -1) : cleanBase;

    const result = `${finalBase}/${cleanPath}`;
    console.log('Final ThumbnailUrl result:', result);
    return result;
  }

  // Fallback to thumbnailUrl for backward compatibility with other endpoints
  if (property.thumbnailUrl) {
    console.log('Using thumbnailUrl:', property.thumbnailUrl);
    // If it's already a full URL, use it
    if (property.thumbnailUrl.startsWith('http')) {
      return property.thumbnailUrl;
    }

    // Build full URL from relative path using API base URL
    const apiBase = environment.apiBaseUrl;
    const cleanBase = apiBase.endsWith('/api') ? apiBase.replace('/api', '') : apiBase;
    const cleanPath = property.thumbnailUrl.startsWith('/') ? property.thumbnailUrl.substring(1) : property.thumbnailUrl;
    const finalBase = cleanBase.endsWith('/') ? cleanBase.slice(0, -1) : cleanBase;

    const result = `${finalBase}/${cleanPath}`;
    console.log('Final thumbnailUrl result:', result);
    return result;
  }

  console.log('Using fallback image:', fallbackImage);
  return fallbackImage;
}

 onImageError(event: any): void {
  console.log('Image failed to load:', event.target.src);
  // Set fallback image
  event.target.src = '/logo2.png';
}


 private loadMyProperties(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.propertyService.getMyProperties().subscribe({
      next: (data) => {
        console.log('API Response - Properties:', data);
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


