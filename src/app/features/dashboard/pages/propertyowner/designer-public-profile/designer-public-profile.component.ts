import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DesignerService, Designer } from '../../../../../core/services/designer.service';
import { WorkspaceService } from '../../../../../core/services/workspace.service';
import { DesignerReview } from '../../../../../core/interfaces/workspace.interface';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-designer-public-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ToastModule,
    ProgressSpinnerModule,
    TagModule
  ],
  providers: [MessageService],
  templateUrl: './designer-public-profile.component.html',
  styleUrl: './designer-public-profile.component.css'
})
export class DesignerPublicProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly designerService = inject(DesignerService);
  private readonly workspaceService = inject(WorkspaceService);
  private readonly messageService = inject(MessageService);

  designer: Designer | null = null;
  reviews: DesignerReview[] = [];
  averageRating: number = 0;
  totalReviews: number = 0;
  loading = true;

  ngOnInit(): void {
    const designerId = this.route.snapshot.paramMap.get('userId');
    if (designerId) {
      this.loadDesignerData(designerId);
    } else {
      this.loading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Designer ID is missing.'
      });
    }
  }

  loadDesignerData(id: string): void {
    this.loading = true;

    forkJoin({
      designer: this.designerService.getDesignerById(id).pipe(catchError(() => of(null))),
      reviews: this.workspaceService.getDesignerReviews(id).pipe(catchError(() => of({ designerId: id, averageRating: 0, totalReviews: 0, reviews: [] })))
    }).subscribe({
      next: (data) => {
        this.designer = data.designer;
        this.reviews = data.reviews.reviews || [];
        this.averageRating = data.reviews.averageRating || 0;
        this.totalReviews = data.reviews.totalReviews || 0;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading designer data:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load designer profile.'
        });
        this.loading = false;
      }
    });
  }
}
