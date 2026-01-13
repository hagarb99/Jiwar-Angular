import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountService, DesignerDto } from '../../../../core/services/account.service';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';

@Component({
    selector: 'app-designers-list',
    standalone: true,
    imports: [CommonModule, NavbarComponent, FooterComponent, FormsModule],
    templateUrl: './designers-list.component.html',
    styles: [`
    .gold-text { color: #D4AF37; }
    .gold-border { border-color: #D4AF37; }
    .gold-bg { background-color: #D4AF37; }
    .hover-gold:hover { background-color: #F8F5E6; }
  `]
})
export class DesignersListComponent implements OnInit {
    private accountService = inject(AccountService);
    private router = inject(Router);

    designers: DesignerDto[] = [];
    loading = true;

    searchQuery: string = '';

    ngOnInit() {
        this.loadDesigners();
    }

    loadDesigners() {
        this.loading = true;
        this.accountService.getDesigners(this.searchQuery).subscribe({
            next: (data) => {
                this.designers = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Failed to load designers', err);
                this.loading = false;
            }
        });
    }

    onSearch() {
        this.loadDesigners();
    }

    viewProfile(id: string) {
        this.router.navigate(['/designer', id]);
    }
}
