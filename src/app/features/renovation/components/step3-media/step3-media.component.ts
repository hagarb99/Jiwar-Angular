
import { Component, ElementRef, ViewChildren, QueryList, inject, OnInit } from '@angular/core';
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
export class Step3MediaComponent implements OnInit {
    private api = inject(RenovationApiService);
    public state = inject(RenovationStateService);
    private router = inject(Router);

    @ViewChildren('fileInput0, fileInput1, fileInput2') fileInputs!: QueryList<ElementRef>;

    uploadingType: number | null = null;
    uploadedFiles: { name: string; type: number }[] = [];

    ngOnInit() {
        if (this.state.isExistingProperty()) {
            this.router.navigate(['/renovation/goals']);
        }
    }

    triggerUpload(type: number) {
        const inputs = this.fileInputs.toArray();
        if (inputs[type]) {
            inputs[type].nativeElement.click();
        }
    }

    onFileSelected(event: Event, type: number) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.uploadingType = type;
            const files = Array.from(input.files);

            setTimeout(() => {
                files.forEach(f => {
                    const mockUrl = `https://mock-storage.com/${f.name}`;
                    this.callApiUpload(type, mockUrl, f.name);
                });

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
