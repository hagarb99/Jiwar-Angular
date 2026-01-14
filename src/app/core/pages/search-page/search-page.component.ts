import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { PropertyCardComponent } from '../../../shared/components/property-card/property-card.component';
import { LucideAngularModule, Search, Filter, MapPin, Home, DollarSign, Bed, Bath } from 'lucide-angular';
import { PropertyService, Property, PropertyType, PropertyFilterDTO } from '../../services/property.service';
import { environment } from '../../../../environments/environment';
import { PaginatorModule } from 'primeng/paginator';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NavbarComponent,
    FooterComponent,
    PropertyCardComponent,
    LucideAngularModule,
    PaginatorModule
  ],
  templateUrl: './search-page.component.html',
  styles: [] // Using Tailwind, styles in HTML
})
export class SearchPageComponent implements OnInit {
  // Icons
  readonly Search = Search;
  readonly Filter = Filter;
  readonly MapPin = MapPin;
  readonly Home = Home;
  readonly DollarSign = DollarSign;
  readonly Bed = Bed;
  readonly Bath = Bath;

  searchForm: FormGroup;

  // Properties array - will be populated from backend
  properties: Property[] = [];

  // Pagination
  first: number = 0;
  rows: number = 9;

  // Loading and error states
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private propertyService: PropertyService
  ) {
    this.searchForm = this.fb.group({
      keyword: [''],
      status: ['buy'], // buy, rent
      type: ['any'], // apartment, villa, etc
      location: [''],
      priceMin: [''],
      priceMax: [''],
      bedrooms: ['any'],
      bathrooms: ['any']
    });
  }

  ngOnInit() {
    // Load all properties on initial page load
    this.loadProperties({});
  }

  onSubmit() {
    // Reset to first page on new search
    this.first = 0;

    const formValue = this.searchForm.value;

    // Map form values to PropertyFilterDTO
    const filter: PropertyFilterDTO = {};

    if (formValue.status === 'buy') {
      filter.listingType = 1;
    } else if (formValue.status === 'rent') {
      filter.listingType = 0;
    }

    // Map location to district
    if (formValue.location && formValue.location.trim() !== '') {
      filter.district = formValue.location.trim();
    }

    // Map price range
    if (formValue.priceMin && formValue.priceMin !== '') {
      filter.minPrice = Number(formValue.priceMin);
    }
    if (formValue.priceMax && formValue.priceMax !== '') {
      filter.maxPrice = Number(formValue.priceMax);
    }

    // Map bedrooms (skip if 'any')
    if (formValue.bedrooms && formValue.bedrooms !== 'any') {
      filter.numBedrooms = Number(formValue.bedrooms);
    }

    // Map bathrooms (skip if 'any')
    if (formValue.bathrooms && formValue.bathrooms !== 'any') {
      filter.numBathrooms = Number(formValue.bathrooms);
    }

    // Map property type to enum (skip if 'any')
    if (formValue.type && formValue.type !== 'any') {
      filter.propertyType = this.mapPropertyTypeToEnum(formValue.type);
    }

    // Load properties with the filter
    this.loadProperties(filter);
  }

  onPageChange(event: any) {
    this.first = event.first;
    this.rows = event.rows;
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Loads properties from the backend API
   * @param filter PropertyFilterDTO with optional filter criteria
   */
  // private loadProperties(filter: PropertyFilterDTO) {
  //   this.isLoading = true;
  //   this.errorMessage = null;

  //   this.propertyService.getFilteredProperties(filter).subscribe({
  //     next: (properties) => {
  //       console.log(properties);

  //       // Sort properties by Newest First (Descending ID or publishedAt if available)
  //       this.properties = properties.sort((a: any, b: any) => {
  //         // If publishedAt exists, use it
  //         if (a.publishedAt && b.publishedAt) {
  //           return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  //         }
  //         // Fallback to ID (assuming higher ID = newer)
  //         return (b.propertyID || b.id || 0) - (a.propertyID || a.id || 0);
  //       });

  //       this.isLoading = false;
  //       console.log('Properties loaded:', properties.length);
  //     },
  //     error: (error) => {
  //       this.errorMessage = 'Failed to load properties. Please try again.';
  //       this.isLoading = false;
  //       console.error('Error loading properties:', error);
  //     }
  //   });
  // }
  private loadProperties(filter: PropertyFilterDTO) {
    this.isLoading = true;
    this.errorMessage = null;

    this.propertyService.getFilteredProperties(filter).subscribe({
      next: (data) => {
        // 'data' هنا هو المصفوفة القادمة من الباك أند مرتبة وجاهزة
        this.properties = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = "Failed to load properties. Please try again.";
        this.isLoading = false;
        console.error('Search error:', err);
      }
    });
  }

  /**
   * Maps the form property type string to the PropertyType enum
   */
  private mapPropertyTypeToEnum(type: string): PropertyType | undefined {
    const typeMap: { [key: string]: PropertyType } = {
      'apartment': PropertyType.Apartment,
      'villa': PropertyType.Villa,
      'house': PropertyType.House,
      'studio': PropertyType.Studio
    };

    return typeMap[type.toLowerCase()];
  }

  /**
   * Formats price number to currency string
   */
  formatPrice(price: number): string {
    return `$${price.toLocaleString()}`;
  }

  /**
   * Converts PropertyType enum to readable string
   */
  getPropertyTypeName(propertyType: PropertyType | undefined): string {
    if (propertyType === undefined) return 'Property';
    const typeNames: { [key in PropertyType]: string } = {
      [PropertyType.Apartment]: 'Apartment',
      [PropertyType.Villa]: 'Villa',
      [PropertyType.House]: 'House',
      [PropertyType.Studio]: 'Studio'
    };

    return typeNames[propertyType] || 'Property';
  }


  /**
   * Generates the full URL for the property thumbnail
   */
  getThumbnailUrl(property: Property): string {
    // Fallback placeholder
    const fallbackImage = '/logo2.png'; // Using existing asset that works

    // 1. Check if thumbnailUrl exists (from browse endpoint)
    if (property.thumbnailUrl) {
      // If it's already a full URL, use it
      if (property.thumbnailUrl.startsWith('http')) {
        return property.thumbnailUrl;
      }

      // Build full URL from relative path
      const apiBase = environment.apiBaseUrl;
      const cleanBase = apiBase.endsWith('/api') ? apiBase.replace('/api', '') : apiBase;
      const cleanPath = property.thumbnailUrl.startsWith('/') ? property.thumbnailUrl.substring(1) : property.thumbnailUrl;
      const finalBase = cleanBase.endsWith('/') ? cleanBase.slice(0, -1) : cleanBase;

      return `${finalBase}/${cleanPath}`;
    }

    // 2. Fallback: Check if propertyMedia exists (from detail endpoint)
    if (!property.propertyMedia || property.propertyMedia.length === 0) {
      return fallbackImage;
    }

    // Filter deleted and sort by order
    const validMedia = property.propertyMedia
      .filter(m => !m.isDeleted)
      .sort((a, b) => a.order - b.order);

    if (validMedia.length === 0) {
      return fallbackImage;
    }

    // Get first image
    const media = validMedia[0];

    // Construct URL
    if (media.mediaURL.startsWith('http')) {
      return media.mediaURL;
    }

    // Base URL from environment (removing /api)
    const apiBase = environment.apiBaseUrl;
    const cleanBase = apiBase.endsWith('/api') ? apiBase.replace('/api', '') : apiBase;

    // Ensure properly formed URL
    const cleanPath = media.mediaURL.startsWith('/') ? media.mediaURL.substring(1) : media.mediaURL;
    const finalBase = cleanBase.endsWith('/') ? cleanBase.slice(0, -1) : cleanBase;

    return `${finalBase}/${cleanPath}`;
  }
}
