import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComparisonService, PropertyComparisonDTO, AiComparisonResultDTO, PropertyComparisonUserType } from '../../core/services/comparison.service';
import { Property } from '../../core/services/property.service';
import { environment } from '../../../environments/environment';
import { LucideAngularModule, X, Scale, MapPin, Maximize2, Bed, Bath, Info, Sparkles, TrendingUp, Brain, Check } from 'lucide-angular';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-comparison-page',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, RouterModule],
    templateUrl: './comparison-page.component.html',
    styleUrls: ['./comparison-page.component.css']
})
export class ComparisonPageComponent implements OnInit {
    private comparisonService = inject(ComparisonService);

    properties: PropertyComparisonDTO[] = [];
    myProperties: Property[] = [];
    showAddModal = false;

    // AI Analysis
    aiResult: AiComparisonResultDTO | null = null;
    isLoadingAi = false;
    selectedUserType: PropertyComparisonUserType = PropertyComparisonUserType.Family;
    UserTypeEnum = PropertyComparisonUserType; // For template access

    // Icons
    X = X;
    Scale = Scale;
    MapPin = MapPin;
    Maximize2 = Maximize2;
    Bed = Bed;
    Bath = Bath;
    Info = Info;
    Sparkles = Sparkles;
    TrendingUp = TrendingUp;
    Brain = Brain;
    Check = Check;

    ngOnInit(): void {
        this.comparisonService.comparisonList$.subscribe(list => {
            this.properties = list;
            // potential clear AI result if properties change?
            if (this.aiResult) {
                // optional: this.aiResult = null; 
            }
        });
    }

    removeProperty(id: number): void {
        this.comparisonService.removeFromCompare(id);
    }

    openAddModal(): void {
        this.showAddModal = true;
        this.comparisonService.getMyProperties().subscribe({
            next: (data) => {
                this.myProperties = data;
            },
            error: (err) => console.error('Error loading my properties', err)
        });
    }

    closeAddModal(): void {
        this.showAddModal = false;
    }

    addToCompare(id: number): void {
        if (this.comparisonService.addToCompare(id)) {
            this.closeAddModal();
        } else {
            // Maybe show specific error message if full
            alert('Cannot add property. Comparisons are limited to 5 items or it is already added.');
        }
    }

    analyze(): void {
        if (this.properties.length < 2) {
            alert('Please add at least 2 properties to compare.');
            return;
        }

        this.isLoadingAi = true;
        this.aiResult = null;

        this.comparisonService.analyzeWithAi(this.selectedUserType).subscribe({
            next: (res) => {
                this.aiResult = res;
                this.isLoadingAi = false;
            },
            error: (err) => {
                console.error('AI Analysis failed', err);
                this.isLoadingAi = false;
                alert('AI Analysis failed. Please try again.');
            }
        });
    }

    setUserType(type: PropertyComparisonUserType): void {
        this.selectedUserType = type;
    }

    getBestValue(category: 'price' | 'area' | 'rooms'): number | null {
        if (this.properties.length < 2) return null;

        if (category === 'price') {
            return Math.min(...this.properties.map(p => p.price));
        }
        if (category === 'area') {
            // Filter out nulls/undefined
            const areas = this.properties.map(p => p.area_sqm).filter((a): a is number => a != null);
            return areas.length > 0 ? Math.max(...areas) : null;
        }
        if (category === 'rooms') {
            const rooms = this.properties.map(p => p.numBedrooms).filter((r): r is number => r != null);
            return rooms.length > 0 ? Math.max(...rooms) : null;
        }
        return null;
    }

    isBest(property: PropertyComparisonDTO, category: 'price' | 'area' | 'rooms'): boolean {
        const bestValue = this.getBestValue(category);
        if (bestValue === null) return false;

        if (category === 'price') return property.price === bestValue;
        if (category === 'area') return (property.area_sqm || 0) === bestValue;
        if (category === 'rooms') return (property.numBedrooms || 0) === bestValue;

        return false;
    }

    formatPrice(price: number): string {
        return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(price);
    }

    resolveImageUrl(url: string | undefined | null): string {
        if (!url) return '/assets/placeholder.jpg';
        if (url.startsWith('http')) return url;

        // Remove trailing slash from base if present
        const baseUrl = environment.assetsBaseUrl.replace(/\/$/, '');
        // Ensure path starts with slash
        const path = url.startsWith('/') ? url : `/${url}`;

        return `${baseUrl}${path}`;
    }

    getScoreColor(score: number): string {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    }
}
