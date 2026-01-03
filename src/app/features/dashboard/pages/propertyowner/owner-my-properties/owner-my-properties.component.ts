import { Component , OnInit, OnDestroy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Property, PropertyService } from '../../../../../core/services/property.service';
import { environment } from '../../../../../../environments/environment';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
@Component({
  selector: 'app-owner-my-properties',
   standalone: true,
  imports: [CommonModule, ToastModule, ConfirmDialogModule],
  templateUrl: './owner-my-properties.component.html',
  styleUrls: ['./owner-my-properties.component.css'],
  providers: [MessageService, ConfirmationService]
})
export class OwnerMyPropertiesComponent implements OnInit, OnDestroy {
    properties: Property[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private propertyService: PropertyService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadMyProperties();

    // Refresh data when navigating back to this component
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        if (event.url.includes('/my-properties')) {
          this.loadMyProperties();
        }
      });
  }

  ngOnDestroy(): void {
    // Cleanup is handled automatically by Angular
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


  loadMyProperties(): void {
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
  
  // owner-my-properties.component.ts

  onEditProperty(property: Property) {
    // Navigate to edit property component with property ID
    this.router.navigate(['/dashboard/propertyowner/edit-property', property.propertyID]);
  }

  onDeleteProperty(property: Property) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${property.title}"?`,
      header: 'Delete Property',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      acceptIcon: 'none',
      rejectIcon: 'none',
      accept: () => {
        this.performDelete(property);
      }
    });
  }

  private performDelete(property: Property) {
    this.propertyService.deleteProperty(property.propertyID).subscribe({
      next: (response) => {
        console.log('Delete response:', response);
        // Remove the property from the local array
        this.properties = this.properties.filter(p => p.propertyID !== property.propertyID);

        // Show success message
        this.messageService.add({
          severity: 'success',
          summary: 'Property Deleted',
          detail: `"${property.title}" has been deleted successfully.`
        });
      },
      error: (error) => {
        console.error('Delete error:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: `Failed to delete "${property.title}". Please try again.`
        });
      }
    });
  }

  navigateToAddProperty(): void {
    this.router.navigate(['/add-property']);
  }

  goToPropertyDetails(property: Property): void {
    this.router.navigate(['/property-details', property.propertyID]);
  }
}