import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComparisonService, PropertyComparisonDTO } from '../../core/services/comparison.service';
import { Property } from '../../core/services/property.service';
import { LucideAngularModule, X, Scale, MapPin, Maximize2, Bed, Bath, Info, Sparkles, TrendingUp } from 'lucide-angular';
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

    ngOnInit(): void {
        this.comparisonService.comparisonList$.subscribe(list => {
            this.properties = list;
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
}
