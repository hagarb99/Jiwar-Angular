import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DesignService } from '../../../../../core/services/design.service';
import { Design } from '../../../../../core/interfaces/design.interface';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ImageModule } from 'primeng/image';
import { GalleriaModule } from 'primeng/galleria';

@Component({
  selector: 'app-my-designs',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    DialogModule,
    ToastModule,
    ProgressSpinnerModule,
    ImageModule,
    GalleriaModule
  ],
  providers: [MessageService],
  templateUrl: './my-designs.component.html',
  styleUrl: './my-designs.component.css'
})
export class MyDesignsComponent implements OnInit {
  designs: Design[] = [];
  loading = false;
  selectedDesign: Design | null = null;
  displayImageDialog = false;
  currentImageIndex = 0;

  constructor(
    private designService: DesignService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadDesigns();
  }

  loadDesigns() {
    this.loading = true;
    this.designService.getMyDesigns().subscribe({
      next: (data) => {
        this.designs = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading designs:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load designs'
        });
        this.loading = false;
      }
    });
  }

  openImageGallery(design: Design, index: number = 0) {
    this.selectedDesign = design;
    this.currentImageIndex = index;
    this.displayImageDialog = true;
  }

  closeImageGallery() {
    this.displayImageDialog = false;
    this.selectedDesign = null;
    this.currentImageIndex = 0;
  }

  getStyleBadgeClass(style: string): string {
    const styles: { [key: string]: string } = {
      'Modern': 'bg-blue-100 text-blue-800',
      'Classic': 'bg-purple-100 text-purple-800',
      'Minimal': 'bg-gray-100 text-gray-800',
      'Luxury': 'bg-amber-100 text-amber-800',
      'Scandinavian': 'bg-green-100 text-green-800'
    };
    return styles[style] || 'bg-gray-100 text-gray-800';
  }
}

