import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminDashboardService, AdminPropertyDto } from '../../../../../../core/services/admin-dashboard.service';
import { PropertyType } from '../../../../../../core/services/property.service';
import { ExcelExportHelper } from '../../../../../../core/utils/admin-helpers';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

// Extended interface for frontend simulation
interface AdminPropertyExtended extends AdminPropertyDto {
  isBooked?: boolean;
}

@Component({
  selector: 'app-properties-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule, ConfirmDialogModule],
  providers: [MessageService, ConfirmationService],
  templateUrl: './properties-list.component.html',
  styleUrl: './properties-list.component.css'
})
export class PropertiesListComponent implements OnInit {
  private adminService = inject(AdminDashboardService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  properties: AdminPropertyExtended[] = [];
  filteredProperties: AdminPropertyExtended[] = [];
  isLoading = false;
  searchTerm = '';
  selectedStatus = 'all'; // 'all', 'booked', 'unbooked'

  // Updated statuses for the filter
  statuses = [
    { label: 'All', value: 'all' },
    { label: 'Booked', value: 'booked' },
    { label: 'Unbooked', value: 'unbooked' }
  ];

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this.isLoading = true;
    this.adminService.getAllProperties().subscribe({
      next: (data: AdminPropertyDto[]) => {
        if (Array.isArray(data)) {
          // Map and simulate "static data" for Booked/Unbooked
          // We will deterministically assign it based on ID to be consistent (e.g. even IDs are booked)
          this.properties = data.map(p => ({
            ...p,
            isBooked: p.id % 2 === 0 // Even IDs are booked, Odd are unbooked (Simulation)
          }));
          this.filteredProperties = [...this.properties];
        } else {
          console.warn('Expected array for properties but got:', data);
          this.properties = [];
          this.filteredProperties = [];
        }
        this.isLoading = false;
        // Apply initial filter if any
        this.filterProperties();
      },
      error: (err: any) => {
        console.error('Error loading properties:', err);
        this.isLoading = false;
      }
    });
  }

  filterProperties(): void {
    this.filteredProperties = this.properties.filter(property => {
      const matchesSearch = !this.searchTerm ||
        property.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        property.city.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        property.ownerName.toLowerCase().includes(this.searchTerm.toLowerCase());

      let matchesStatus = true;
      if (this.selectedStatus === 'booked') {
        matchesStatus = property.isBooked === true;
      } else if (this.selectedStatus === 'unbooked') {
        matchesStatus = property.isBooked === false;
      }

      return matchesSearch && matchesStatus;
    });
  }

  exportToExcel(): void {
    const dataToExport = this.filteredProperties.map(p => ({
      ID: p.id,
      Title: p.title,
      City: p.city,
      Owner: p.ownerName,
      Price: p.price || 0,
      Status: p.isBooked ? 'Booked' : 'Unbooked',
      Created: p.createdDate
    }));

    ExcelExportHelper.exportToExcel(dataToExport, 'properties_list');
  }

  getPropertyTypeName(type?: PropertyType): string {
    if (type === undefined) return 'Property';
    switch (type) {
      case PropertyType.Apartment: return 'Apartment';
      case PropertyType.Villa: return 'Villa';
      case PropertyType.Studio: return 'Studio';
      case PropertyType.Office: return 'Office';
      case PropertyType.EmptyLand: return 'Empty Land';
      case PropertyType.Duplex: return 'Duplex';
      case PropertyType.Shop: return 'Shop';
      case PropertyType.Garage: return 'Garage';
      default: return 'Property';
    }
  }

  getStatusBadgeClass(isBooked?: boolean): string {
    return isBooked
      ? 'bg-green-100 text-green-700' // Booked
      : 'bg-gray-100 text-gray-700';  // Unbooked
  }
}

