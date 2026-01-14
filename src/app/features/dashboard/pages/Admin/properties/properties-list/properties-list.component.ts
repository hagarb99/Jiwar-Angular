import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminDashboardService, AdminPropertyDto } from '../../../../../../core/services/admin-dashboard.service';
import { PropertyType } from '../../../../../../core/services/property.service';
import { ExcelExportHelper } from '../../../../../../core/utils/admin-helpers';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

enum PropEnum {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  Archived = 3
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

  properties: AdminPropertyDto[] = [];
  filteredProperties: AdminPropertyDto[] = [];
  isLoading = false;
  searchTerm = '';
  selectedStatus = '';

  PropEnum = PropEnum;
  statuses = [
    { label: 'All', value: '' },
    { label: 'Pending', value: PropEnum.Pending },
    { label: 'Approved', value: PropEnum.Approved },
    { label: 'Rejected', value: PropEnum.Rejected },
    { label: 'Archived', value: PropEnum.Archived }
  ];

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this.isLoading = true;
    this.adminService.getAllProperties().subscribe({
      next: (data: AdminPropertyDto[]) => {
        if (Array.isArray(data)) {
          this.properties = data;
          this.filteredProperties = data;
        } else {
          console.warn('Expected array for properties but got:', data);
          this.properties = [];
          this.filteredProperties = [];
        }
        this.isLoading = false;
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

      const matchesStatus = this.selectedStatus === '' ||
        property.status === Number(this.selectedStatus);

      return matchesSearch && matchesStatus;
    });
  }

  updatePropertyStatus(propertyId: number, newStatus: PropEnum, propertyTitle: string): void {
    this.confirmationService.confirm({
      message: `Update status for "${propertyTitle}"?`,
      header: 'Status Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.adminService.updatePropertyStatus(propertyId, newStatus).subscribe({
          next: () => {
            const property = this.properties.find(p => p.id === propertyId);
            if (property) {
              property.status = newStatus;
            }
            this.filterProperties();
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Property status updated successfully' });
          },
          error: (err: any) => {
            console.error('Error updating property status:', err);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update property status' });
          }
        });
      }
    });
  }

  exportToExcel(): void {
    const dataToExport = this.filteredProperties.map(p => ({
      ID: p.id,
      Title: p.title,
      City: p.city,
      Owner: p.ownerName,
      Price: p.price || 0,
      Status: PropEnum[p.status],
      Created: p.createdDate
    }));

    ExcelExportHelper.exportToExcel(dataToExport, 'properties_list');
  }

  getStatusLabel(status: number): string {
    return PropEnum[status] || 'Unknown';
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

  getStatusBadgeClass(status: number): string {
    const statusClasses: { [key: number]: string } = {
      [PropEnum.Pending]: 'bg-yellow-100 text-yellow-700',
      [PropEnum.Approved]: 'bg-green-100 text-green-700',
      [PropEnum.Rejected]: 'bg-red-100 text-red-700',
      [PropEnum.Archived]: 'bg-gray-100 text-gray-700'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-700';
  }
}

