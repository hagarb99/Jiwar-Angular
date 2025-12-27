
import { Component, ElementRef, ViewChildren, QueryList, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { RenovationApiService } from '../../services/renovation-api.service';
import { RenovationStateService } from '../../services/renovation-state.service';
import { SimulationMediaTypeEnum, UploadSimulationMediaDto } from '../../models/renovation.models';

@Component({
    selector: 'app-step3-media',
    standalone: true,
    imports: [CommonModule, RouterModule, NavbarComponent, FooterComponent],
    templateUrl: './step3-media.component.html'
})
export class Step3MediaComponent {
    private api = inject(RenovationApiService);
    private state = inject(RenovationStateService);
    private router = inject(Router);

    @ViewChildren('fileInput0, fileInput1, fileInput2') fileInputs!: QueryList<ElementRef>;

    uploadingType: number | null = null;
    uploadedFiles: { name: string; type: number }[] = [];

    triggerUpload(type: number) {
        const inputs = this.fileInputs.toArray();
        // inputs[0] corresponds to type 0? Since template order is 0, 1, 2, safely assume index matches
        if (inputs[type]) {
            inputs[type].nativeElement.click();
        }
    }

    onFileSelected(event: Event, type: number) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.uploadingType = type;
            // Simulate multiple uploads
            // In real scenario, loop through files calls upload API for each
            // Since backend doesn't handle binary here (assumed URL), we mock the upload-to-cloud part

            const files = Array.from(input.files);

            // Chain uploads sequentially or parallel. Assume parallel for simplicity.
            // We'll treat this as "upload to S3, get URL, send to API"
            // Mocking 1.5s delay
            setTimeout(() => {
                files.forEach(f => {
                    // Mock URL
                    const mockUrl = `https://mock-storage.com/${f.name}`;
                    this.callApiUpload(type, mockUrl, f.name);
                });

                // Reset
                this.uploadingType = null;
                input.value = '';
            }, 1500);
        }
    }



    callApiUpload(type: SimulationMediaTypeEnum, url: string, fileName: string) {
        const simulationId = this.state.getSimulationIdOrThrow();
        const dto: UploadSimulationMediaDto = {
            mediaType: type,
            fileUrl: url
        };

        this.api.uploadMedia(simulationId, dto).subscribe({
            next: () => {
                this.uploadedFiles.push({ name: fileName, type });
            },
            error: (err) => console.error('Upload failed', err)
        });
    }
}
