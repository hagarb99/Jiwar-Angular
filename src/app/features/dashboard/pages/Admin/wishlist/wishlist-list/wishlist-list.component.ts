import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminDashboardService, AdminWishlistDto } from '../../../../../../core/services/admin-dashboard.service';
import { ExcelExportHelper } from '../../../../../../core/utils/admin-helpers';

@Component({
    selector: 'app-wishlist-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './wishlist-list.component.html',
    styleUrl: './wishlist-list.component.css'
})
export class WishlistListComponent implements OnInit {
    private adminService = inject(AdminDashboardService);

    wishlists: AdminWishlistDto[] = [];
    filteredWishlists: AdminWishlistDto[] = [];
    isLoading = false;
    searchTerm = '';

    ngOnInit(): void {
        this.loadWishlists();
    }

    loadWishlists(): void {
        this.isLoading = true;
        this.adminService.getAllWishlists().subscribe({
            next: (data: AdminWishlistDto[]) => {
                if (Array.isArray(data)) {
                    this.wishlists = data;
                    this.filteredWishlists = data;
                } else {
                    console.warn('Expected array for wishlists but got:', data);
                    this.wishlists = [];
                    this.filteredWishlists = [];
                }
                this.isLoading = false;
            },
            error: (err: any) => {
                console.error('Error loading wishlists:', err);
                this.isLoading = false;
            }
        });
    }

    filterWishlists(): void {
        this.filteredWishlists = this.wishlists.filter(wishlist => {
            const matchesSearch = !this.searchTerm ||
                wishlist.userName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                wishlist.propertyTitle.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                (wishlist.notes && wishlist.notes.toLowerCase().includes(this.searchTerm.toLowerCase()));

            return matchesSearch;
        });
    }

    exportToExcel(): void {
        const dataToExport = this.filteredWishlists.map(w => ({
            ID: w.id,
            'User Name': w.userName,
            'User ID': w.userId,
            'Property Title': w.propertyTitle,
            'Property ID': w.propertyId,
            'Added Date': w.addedDate,
            Notes: w.notes || 'None'
        }));

        ExcelExportHelper.exportToExcel(dataToExport, 'wishlist_report');
    }
}
