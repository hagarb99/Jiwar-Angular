import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceService } from '../../../../../core/services/workspace.service';
import { ProfileService } from '../profile-interiordesigner/profile.service';
import { DesignerReview } from '../../../../../core/interfaces/workspace.interface';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RatingModule } from 'primeng/rating';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-designer-reviews',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule, RatingModule, FormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './designer-reviews.component.html',
  styleUrl: './designer-reviews.component.css'
})
export class DesignerReviewsComponent implements OnInit {
  private workspaceService = inject(WorkspaceService);
  private profileService = inject(ProfileService);
  private messageService = inject(MessageService);

  reviews: DesignerReview[] = [];
  averageRating: number = 0;
  totalReviews: number = 0;
  loading = true;

  ngOnInit(): void {
    this.loadReviews();
  }

  loadReviews(): void {
    this.loading = true;
    this.profileService.getProfile().pipe(
      switchMap(profile => {
        const id = profile.id || profile.Id;
        return this.workspaceService.getDesignerReviews(id);
      }),
      catchError(err => {
        console.error('Error loading reviews:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load your reviews.'
        });
        return of({ designerId: '', averageRating: 0, totalReviews: 0, reviews: [] });
      })
    ).subscribe(data => {
      this.reviews = data.reviews || [];
      this.averageRating = data.averageRating || 0;
      this.totalReviews = data.totalReviews || 0;
      this.loading = false;
    });
  }
}
