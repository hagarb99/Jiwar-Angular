import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminAnalyticsService } from '../../../../../core/services/admin-analytics.service';
import { AdminAnalyticsDTO } from '../../../../../core/models/admin-analytics.dto';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { LucideAngularModule, MapPin } from 'lucide-angular';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, LucideAngularModule],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.css'
})
export class OverviewComponent implements OnInit {
  MapPin = MapPin;
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

  public lineChartType: ChartType = 'line';

  // Revenue Chart
  public revenueChartData: ChartData<'line'> = {
    labels: [],

    datasets: [
      {
        data: [],
        label: 'Revenue Trends',
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };
  public revenueChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { display: true }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  constructor(private analyticsService: AdminAnalyticsService) { }

  ngOnInit(): void {
    this.analyticsService.getAnalytics().subscribe({
      next: (data) => {


        this.analyticsData = data;

        // Static fallbacks as requested by user
        if (!this.analyticsData.engagementMetrics.pageVisits) {
          this.analyticsData.engagementMetrics.pageVisits = 12500; // Static mockup
        }
        if (!this.analyticsData.engagementMetrics.propertyViews) {
          this.analyticsData.engagementMetrics.propertyViews = 8400; // Static mockup
        }
        if (Object.keys(this.analyticsData.engagementMetrics.searchTrends).length === 0) {
          this.analyticsData.engagementMetrics.searchTrends = {
            'Luxury Villa': 450,
            'Apartment Cairo': 320,
            'New Capital': 280,
            'Rent Giza': 150
          };
        }

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



        // Map Revenue Trends
        if (data.paymentMetrics.revenueByPeriod) {
          const periods = Object.keys(data.paymentMetrics.revenueByPeriod);
          const amounts = Object.values(data.paymentMetrics.revenueByPeriod);
          this.revenueChartData = {
            labels: periods,
            datasets: [{ ...this.revenueChartData.datasets[0], data: amounts }]
          };
        }
      },
      error: (err: any) => {
        console.error('Error fetching analytics', err);
        this.error = 'Failed to load dashboard data. Please check backend connection.';
        this.isLoading = false;
      }
    });
  }
}
