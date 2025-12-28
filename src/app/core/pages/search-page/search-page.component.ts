import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { PropertyCardComponent } from '../../../shared/components/property-card/property-card.component';
import { LucideAngularModule, Search, Filter, MapPin, Home, DollarSign, Bed, Bath } from 'lucide-angular';
import { PropertyService, Property, PropertyType, PropertyFilterDTO } from '../../services/property.service';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NavbarComponent,
    FooterComponent,
    PropertyCardComponent,
    LucideAngularModule
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
    const formValue = this.searchForm.value;

    // Map form values to PropertyFilterDTO
    const filter: PropertyFilterDTO = {};

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

  /**
   * Loads properties from the backend API
   * @param filter PropertyFilterDTO with optional filter criteria
   */
  private loadProperties(filter: PropertyFilterDTO) {
    this.isLoading = true;
    this.errorMessage = null;

    this.propertyService.getFilteredProperties(filter).subscribe({
      next: (properties) => {
        this.properties = properties;
        this.isLoading = false;
        console.log('Properties loaded:', properties.length);
      },
      error: (error) => {
        this.errorMessage = 'Failed to load properties. Please try again.';
        this.isLoading = false;
        console.error('Error loading properties:', error);
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
  getPropertyTypeName(propertyType: PropertyType): string {
    const typeNames: { [key in PropertyType]: string } = {
      [PropertyType.Apartment]: 'Apartment',
      [PropertyType.Villa]: 'Villa',
      [PropertyType.House]: 'House',
      [PropertyType.Studio]: 'Studio'
    };

    return typeNames[propertyType] || 'Property';
  }
}
