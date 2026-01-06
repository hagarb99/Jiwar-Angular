import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminAnalyticsService } from '../../../../../core/services/admin-analytics.service';
import { AdminAnalyticsDTO } from '../../../../../core/models/admin-analytics.dto';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.css'
})
export class OverviewComponent implements OnInit {
  analyticsData: AdminAnalyticsDTO | null = null;
  isLoading = true;
  error: string | null = null;

  // Role Distribution Chart
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      }
    }
  };
  public pieChartData: ChartData<'pie', number[], string | string[]> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']
    }]
  };
  public pieChartType: ChartType = 'pie';

  // Revenue/Valuation Chart
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
  };
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Valuations', backgroundColor: '#3b82f6' }
    ]
  };
  public barChartType: ChartType = 'bar';

  constructor(private analyticsService: AdminAnalyticsService) { }

  ngOnInit(): void {
    this.analyticsService.getAnalytics().subscribe({
      next: (data) => {
        this.analyticsData = data;
        this.isLoading = false;

        // Map Roles Distribution
        if (data.usersMetrics.userRolesDistribution) {
          const roles = Object.keys(data.usersMetrics.userRolesDistribution);
          const counts = Object.values(data.usersMetrics.userRolesDistribution);
          this.pieChartData = {
            labels: roles,
            datasets: [{ ...this.pieChartData.datasets[0], data: counts }]
          };
        }

        // Map Valuations Trends
        if (data.valuationMetrics.valuationsPerPeriod) {
          const periods = Object.keys(data.valuationMetrics.valuationsPerPeriod);
          const counts = Object.values(data.valuationMetrics.valuationsPerPeriod);
          this.barChartData = {
            labels: periods,
            datasets: [{ ...this.barChartData.datasets[0], data: counts }]
          };
        }
      },
      error: (err) => {
        console.error('Error fetching analytics', err);
        this.error = 'Failed to load dashboard data. Please check backend connection.';
        this.isLoading = false;
      }
    });
  }
}
