import { Component, Input, AfterViewInit, OnDestroy, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

declare var pannellum: any;

@Component({
    selector: 'app-panorama-viewer',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="panorama-container" [style.height]="height">
      <div #panoramaElement class="panorama-viewer"></div>
      <div *ngIf="!src" class="no-image-overlay">
        <div class="overlay-content">
          <i class="pi pi-image text-4xl mb-2"></i>
          <p>No 360° image available</p>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .panorama-container {
      position: relative;
      width: 100%;
      border-radius: 12px;
      overflow: hidden;
      background: #f4f4f4;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .panorama-viewer {
      width: 100%;
      height: 100%;
    }
    .no-image-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0,0,0,0.03);
      color: #777;
    }
    .overlay-content {
      text-align: center;
    }
  `]
})
export class PanoramaViewerComponent implements AfterViewInit, OnDestroy, OnChanges {
    @Input() src: string | undefined;
    @Input() height: string = '400px';
    @Input() autoLoad: boolean = true;
    @Input() compass: boolean = false;

    @ViewChild('panoramaElement') panoramaElement!: ElementRef;

    private viewer: any;

    ngAfterViewInit() {
        if (this.src) {
            this.initViewer();
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['src'] && !changes['src'].firstChange) {
            this.destroyViewer();
            if (this.src) {
                this.initViewer();
            }
        }
    }

    private initViewer() {
        if (typeof pannellum === 'undefined') {
            console.error('Pannellum is not loaded. Please ensure it is included in your project.');
            return;
        }

        this.viewer = pannellum.viewer(this.panoramaElement.nativeElement, {
            type: 'equirectangular',
            panorama: this.src,
            autoLoad: this.autoLoad,
            compass: this.compass,
            showControls: true
        });
    }

    private destroyViewer() {
        if (this.viewer) {
            this.viewer.destroy();
            this.viewer = null;
        }
    }

    ngOnDestroy() {
        this.destroyViewer();
    }
}
