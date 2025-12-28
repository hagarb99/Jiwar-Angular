import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { PropertyCardComponent } from '../../../shared/components/property-card/property-card.component';
import { LucideAngularModule, Search, Filter, MapPin, Home, DollarSign, Bed, Bath } from 'lucide-angular';

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
export class SearchPageComponent {
  // Icons
  readonly Search = Search;
  readonly Filter = Filter;
  readonly MapPin = MapPin;
  readonly Home = Home;
  readonly DollarSign = DollarSign;
  readonly Bed = Bed;
  readonly Bath = Bath;

  searchForm: FormGroup;

  // Properties array - currently empty as per "No dummy data" requirement.
  // This will be populated by the backend in the future.
  properties: any[] = [];

  constructor(private fb: FormBuilder) {
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

  onSubmit() {
    console.log('Search Filters:', this.searchForm.value);
    // Future backend call
  }
}
