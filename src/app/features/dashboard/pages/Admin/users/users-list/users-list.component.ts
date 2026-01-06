import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminDashboardService, AdminUserDto } from '../../../../../../core/services/admin-dashboard.service';
import { ExcelExportHelper, PaginationHelper } from '../../../../../../core/utils/admin-helpers';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.css'
})
export class UsersListComponent implements OnInit {
  private adminService = inject(AdminDashboardService);
  protected readonly Math = Math;

  users: AdminUserDto[] = [];
  filteredUsers: AdminUserDto[] = [];
  isLoading = false;
  searchTerm = '';
  selectedRole = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  pages: number[] = [];

  roles = ['All', 'Admin', 'PropertyOwner', 'Customer', 'InteriorDesigner'];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.adminService.getAllUsers().subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.users = data;
          this.filteredUsers = data;
          this.updatePagination();
        } else {
          console.warn('Expected array for users but got:', data);
          this.users = [];
          this.filteredUsers = [];
          this.updatePagination();
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.isLoading = false;
      }
    });
  }

  filterUsers(): void {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = !this.searchTerm ||
        user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesRole = !this.selectedRole || this.selectedRole === 'All' ||
        user.role === this.selectedRole;

      return matchesSearch && matchesRole;
    });
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = PaginationHelper.calculateTotalPages(this.filteredUsers.length, this.pageSize);
    this.pages = PaginationHelper.getPageNumbers(this.currentPage, this.totalPages);
  }

  getPagedUsers(): AdminUserDto[] {
    return PaginationHelper.getPagedData(this.filteredUsers, this.currentPage, this.pageSize);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  deleteUser(userId: string, userName: string): void {
    if (confirm(`Are you sure you want to delete user "${userName}"?`)) {
      this.adminService.deleteUser(userId).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== userId);
          this.filterUsers();
          alert('User deleted successfully');
        },
        error: (err) => {
          console.error('Error deleting user:', err);
          alert('Failed to delete user');
        }
      });
    }
  }

  exportToExcel(): void {
    const dataToExport = this.filteredUsers.map(u => ({
      ID: u.id,
      Name: u.name,
      Email: u.email,
      Phone: u.phoneNumber || 'N/A',
      Role: u.role,
      'Joined Date': u.createdDate,
      Status: u.isActive ? 'Active' : 'Inactive'
    }));

    ExcelExportHelper.exportToExcel(dataToExport, 'users_list');
  }

  getRoleBadgeClass(role: string): string {
    const roleClasses: { [key: string]: string } = {
      'Admin': 'bg-red-100 text-red-700',
      'PropertyOwner': 'bg-blue-100 text-blue-700',
      'Customer': 'bg-green-100 text-green-700',
      'InteriorDesigner': 'bg-purple-100 text-purple-700'
    };
    return roleClasses[role] || 'bg-gray-100 text-gray-700';
  }
}
