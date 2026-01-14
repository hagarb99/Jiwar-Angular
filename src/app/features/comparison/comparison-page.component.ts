import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    LucideAngularModule,
    X,
    Brain,
    Trophy,
    Star,
    MapPin,
    Maximize,
    Bed,
    Bath,
    TrendingUp,
    DollarSign,
    Award,
    Sparkles,
    CheckCircle
} from 'lucide-angular';
import { ComparisonService } from '../../core/services/comparison.service';
import { AiComparisonResultDTO } from '../../core/models/ai-comparison-result.dto';
import { PropertyComparisonUserType } from '../../core/models/property-comparison-user-type.enum';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
    selector: 'app-comparison',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        LucideAngularModule,
        NavbarComponent,
        FooterComponent
    ],
    templateUrl: './comparison-page.component.html',
    styleUrls: ['./comparison-page.component.css']
})
export class ComparisonPageComponent implements OnInit {

    properties: any[] = [];
    comparisonIds: number[] = [];

    // Icons for standard features
    readonly X = X;
    readonly Brain = Brain;
    readonly Trophy = Trophy;
    readonly Star = Star;
    readonly MapPin = MapPin;
    readonly Maximize = Maximize;
    readonly Bed = Bed;
    readonly Bath = Bath;

    // Icons for AI analysis
    readonly TrendingUp = TrendingUp;
    readonly DollarSign = DollarSign;
    readonly Award = Award;
    readonly Sparkles = Sparkles;
    readonly CheckCircle = CheckCircle;

    aiResult: AiComparisonResultDTO | null = null;
    isLoadingAi = false;

    selectedUserType: PropertyComparisonUserType = PropertyComparisonUserType.Investor;

    constructor(private comparisonService: ComparisonService) { }

    ngOnInit(): void {
        this.comparisonService.comparisonList$.subscribe(list => {
            const previousIds = this.comparisonIds.join(',');

            this.properties = list;
            this.comparisonIds = list.map(p => p.propertyID);

            if (previousIds !== this.comparisonIds.join(',')) {
                this.aiResult = null;
            }
        });
    }

    analyze(): void {
        if (this.comparisonIds.length < 2 || this.isLoadingAi) return;

        this.isLoadingAi = true;
        this.aiResult = null;

        this.comparisonService
            .analyzeWithAi(this.selectedUserType)
            .subscribe({
                next: result => {
                    this.aiResult = result;
                    this.isLoadingAi = false;
                },
                error: (err: any) => {
                    console.error('AI Analysis failed', err);
                    this.isLoadingAi = false;
                }
            });
    }

    getPropertyById(id: number) {
        return this.properties.find(p => p.propertyID === id);
    }

    formatCategory(key: string): string {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
    }

    removeProperty(id: number): void {
        this.comparisonService.removeFromComparison(id);
    }

    formatPrice(price: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(price);
    }

    onImageError(event: Event): void {
        const img = event.target as HTMLImageElement;
        img.onerror = null; // Prevent infinite loop
        img.src = '/assets/placeholder.jpg';
    }
}
