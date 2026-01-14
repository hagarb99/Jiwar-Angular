import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Image as LucideImage, Upload, CheckCircle, AlertCircle, X } from 'lucide-angular';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-panorama-upload',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ToastModule],
  providers: [MessageService],
  template: `
    <div class="upload-container" [class.dragging]="isDragging" 
         (dragover)="onDragOver($event)" 
         (dragleave)="onDragLeave($event)" 
         (drop)="onDrop($event)">
      
      <div *ngIf="!previewUrl && !isUploading" class="upload-vibe" (click)="fileInput.click()">
        <lucide-angular [img]="UploadIcon" class="upload-icon"></lucide-angular>
        <div class="upload-text">
          <h3>Upload 360° Panorama</h3>
          <p>Equirectangular image (2:1 ratio) required</p>
          <span class="browse-btn">Browse Files</span>
        </div>
      </div>

      <div *ngIf="isUploading" class="uploading-state">
        <div class="spinner"></div>
        <p>Validating & Uploading...</p>
      </div>

      <div *ngIf="previewUrl && !isUploading" class="preview-state">
        <div class="preview-overlay">
          <div class="preview-info">
            <lucide-angular [img]="CheckCircleIcon" class="success-icon"></lucide-angular>
            <span>Valid 360° Image Ready!</span>
          </div>
          <button class="remove-btn" (click)="clearSelection()">
            <lucide-angular [img]="XIcon" size="18"></lucide-angular>
          </button>
        </div>
        <img [src]="previewUrl" class="panorama-preview-img" alt="Panorama Preview">
      </div>

      <input type="file" #fileInput (change)="onFileSelected($event)" accept="image/*" class="hidden">
      
      <div *ngIf="error" class="error-msg">
        <lucide-angular [img]="AlertIcon" size="16"></lucide-angular>
        <span>{{error}}</span>
      </div>
    </div>
  `,
  styles: [`
    .upload-container {
      width: 100%;
      min-height: 200px;
      border: 2px dashed #e0e0e0;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      transition: all 0.3s ease;
      background: #fafafa;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }
    .upload-container:hover, .upload-container.dragging {
      border-color: #3b82f6;
      background: #eff6ff;
    }
    .upload-vibe {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    .upload-icon {
      width: 48px;
      height: 48px;
      color: #3b82f6;
    }
    .upload-text h3 {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 4px;
      color: #1f2937;
    }
    .upload-text p {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 12px;
    }
    .browse-btn {
      padding: 8px 16px;
      background: #3b82f6;
      color: white;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
    }
    .uploading-state {
      text-align: center;
      color: #3b82f6;
    }
    .preview-state {
      width: 100%;
      height: 100%;
      position: relative;
    }
    .panorama-preview-img {
      width: 100%;
      height: 180px;
      object-fit: cover;
      border-radius: 8px;
    }
    .preview-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      padding: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(to bottom, rgba(0,0,0,0.5), transparent);
      z-index: 2;
      border-radius: 8px 8px 0 0;
    }
    .preview-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: white;
      font-size: 14px;
      font-weight: 500;
    }
    .success-icon {
      color: #10b981;
    }
    .remove-btn {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      backdrop-filter: blur(4px);
    }
    .remove-btn:hover {
      background: rgba(239, 68, 68, 0.8);
    }
    .error-msg {
      margin-top: 12px;
      color: #ef4444;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .hidden { display: none; }
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 12px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class PanoramaUploadComponent {
  @Output() urlUploaded = new EventEmitter<string>();

  previewUrl: string | null = null;
  isUploading = false;
  isDragging = false;
  error: string | null = null;

  readonly UploadIcon = Upload;
  readonly ImageIcon = LucideImage;
  readonly CheckCircleIcon = CheckCircle;
  readonly AlertIcon = AlertCircle;
  readonly XIcon = X;

  constructor(private messageService: MessageService) { }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.processFile(file);
    }
  }

  private processFile(file: File) {
    if (!file.type.startsWith('image/')) {
      this.error = 'Please select a valid image file.';
      return;
    }

    this.isUploading = true;
    this.error = null;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new (window as any).Image();
      img.onload = () => {
        const width = img.width;
        const height = img.height;

        // Validate 2:1 ratio (equirectangular)
        const ratio = width / height;
        if (Math.abs(ratio - 2) > 0.05) {
          this.isUploading = false;
          this.error = 'Invalid ratio. Panorama must be 2:1 (width:height). Found: ' + ratio.toFixed(2) + ':1';
          return;
        }

        this.previewUrl = e.target.result;
        this.mockUpload(file);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  private mockUpload(file: File) {
    setTimeout(() => {
      // Sanitize filename: Use GUID and original extension
      const extension = file.name.split('.').pop() || 'jpg';
      const guid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      const sanitizedName = `${guid}.${extension}`;

      const fakeUrl = `https://storage.jiwar.com/panoramas/${sanitizedName}`;

      this.isUploading = false;
      this.urlUploaded.emit(fakeUrl);
      this.messageService.add({
        severity: 'success',
        summary: 'Panorama Validated',
        detail: '360° image ready for property tour.'
      });
    }, 1500);
  }

  clearSelection() {
    this.previewUrl = null;
    this.urlUploaded.emit('');
  }
}
