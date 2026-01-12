import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

interface OwnerStats {
    totalProperties: number;
    activeListings: number;
    monthlyRevenue: number;
    responseRate: number;
}

interface MonthlyData {
    month: string;
    value: number;
}

interface PropertySummary {
    id: number;
    title: string;
    location: string;
    price: string;
    status: 'active' | 'pending' | 'leased';
    image: string;
}

interface RecentActivity {
    id: number;
    title: string;
    description: string;
    time: string;
    icon: string;
    bg: string;
    color: string;
}

@Component({
    selector: 'app-owner-overview',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './owner-overview.component.html',
    styleUrls: ['./owner-overview.component.css']
})
export class OwnerOverviewComponent implements OnInit {
    stats: OwnerStats = {
        totalProperties: 8,
        activeListings: 5,
        monthlyRevenue: 125400,
        responseRate: 98
    };

    monthlyData: MonthlyData[] = [
        { month: 'Jan', value: 45 },
        { month: 'Feb', value: 52 },
        { month: 'Mar', value: 48 },
        { month: 'Apr', value: 70 },
        { month: 'May', value: 65 },
        { month: 'Jun', value: 85 },
        { month: 'Jul', value: 90 },
        { month: 'Aug', value: 75 },
        { month: 'Sep', value: 60 },
        { month: 'Oct', value: 80 },
        { month: 'Nov', value: 95 },
        { month: 'Dec', value: 100 }
    ];

    propertiesSummary: PropertySummary[] = [
        { id: 1, title: 'Luxury Penthouse', location: 'New Cairo', price: '45,000 EGP', status: 'leased', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200' },
        { id: 2, title: 'Garden Villa', location: '6th October', price: '85,000 EGP', status: 'active', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=200' },
        { id: 3, title: 'Modern Studio', location: 'Zamalek', price: '15,000 EGP', status: 'pending', image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=200' },
        { id: 4, title: 'Beach House', location: 'North Coast', price: '120,000 EGP', status: 'active', image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=200' }
    ];

    recentActivities: RecentActivity[] = [
        { id: 1, title: 'New Booking Request', description: 'Ahmed requested a viewing for Garden Villa', time: '10 mins ago', icon: 'pi-calendar', bg: '#fff7ed', color: '#ea580c' },
        { id: 2, title: 'Payment Received', description: 'Monthly rent for Luxury Penthouse', time: '2 hours ago', icon: 'pi-check-circle', bg: '#f0fdf4', color: '#16a34a' },
        { id: 3, title: 'Message from Tenant', description: 'Sarah sent a maintenance request', time: '5 hours ago', icon: 'pi-envelope', bg: '#eff6ff', color: '#2563eb' }
    ];

    constructor(private router: Router) { }

    ngOnInit(): void { }

    navigateTo(path: string): void {
        this.router.navigate([path]);
    }

    navigateToAddProperty(): void {
        this.router.navigate(['/add-property']);
    }

    onExport(): void {
        console.log('Exporting report...');
        // logic for export
    }

    onImageError(event: any): void {
        event.target.src = '/assets/images/property-placeholder.jpg';
    }
}
