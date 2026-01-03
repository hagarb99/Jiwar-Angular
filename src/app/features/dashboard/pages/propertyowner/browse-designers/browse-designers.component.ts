import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { DesignerService, Designer } from '../../../../../core/services/designer.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-browse-designers',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ToastModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    ProgressSpinnerModule,
    TagModule
  ],
  providers: [MessageService],
  templateUrl: './browse-designers.component.html',
  styleUrls: ['./browse-designers.component.css']
})
export class BrowseDesignersComponent implements OnInit {
  designers: Designer[] = [];
  filteredDesigners: Designer[] = [];
  loading = true;
  searchQuery = '';
  returnTo = '';
  step = '';

  constructor(
    private designerService: DesignerService,
    private messageService: MessageService,
    public router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.returnTo = params['returnTo'] || '/dashboard/propertyowner';
      this.step = params['step'] || '';
    });
    this.loadDesigners();
  }

  loadDesigners(): void {
    this.loading = true;
    this.designerService.getAllDesigners().subscribe({
      next: (designers) => {
        this.designers = designers;
        this.filteredDesigners = designers;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading designers:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load designers. Please try again.'
        });
        this.loading = false;
      }
    });
  }

  searchDesigners(): void {
    if (!this.searchQuery.trim()) {
      this.filteredDesigners = this.designers;
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredDesigners = this.designers.filter(designer =>
      designer.name.toLowerCase().includes(query) ||
      designer.title?.toLowerCase().includes(query) ||
      designer.location?.toLowerCase().includes(query)
    );
  }

  goBack(): void {
    if (this.returnTo) {
      this.router.navigate([this.returnTo], {
        queryParams: { step: this.step }
      });
    } else {
      this.router.navigate(['/dashboard/propertyowner']);
    }
  }

  selectDesigner(designer: Designer): void {
    // Store selected designer in sessionStorage to pass back to create request
    sessionStorage.setItem('selectedDesigner', JSON.stringify(designer));
    
    if (this.returnTo) {
      this.router.navigate([this.returnTo], {
        queryParams: { step: this.step, designerId: designer.id }
      });
    } else {
      this.router.navigate(['/dashboard/propertyowner']);
    }
  }
}

