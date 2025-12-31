import { Component , OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Property, PropertyService } from '../../../../../../core/services/property.service';
import { environment } from '../../../../../../../environments/environment';
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
  if (property.thumbnailUrl) {
    // Always prepend API base if it starts with "/"
    return property.thumbnailUrl.startsWith('/')
      ? `${environment.apiBaseUrl}${property.thumbnailUrl}`
      : property.thumbnailUrl;
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


