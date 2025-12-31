import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminAnalyticsService } from '../../../../../core/services/admin-analytics.service';
import { AdminAnalyticsDTO } from '../../../../../core/models/admin-analytics.dto';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.css'
})
export class OverviewComponent implements OnInit {
  analyticsData: AdminAnalyticsDTO | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(private analyticsService: AdminAnalyticsService) { }

  ngOnInit(): void {
    this.analyticsService.getAnalytics().subscribe({
      next: (data) => {
        this.analyticsData = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching analytics', err);
        this.error = 'Failed to load dashboard data.';
        this.isLoading = false;
      }
    });
  }
}
