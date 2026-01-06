import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({
    name: 'safe',
    standalone: true
})
export class SafePipe implements PipeTransform {
    private sanitizer = inject(DomSanitizer);

    transform(url: string, type: string = 'resourceUrl'): any {
        switch (type) {
            case 'html': return this.sanitizer.bypassSecurityTrustHtml(url);
            case 'style': return this.sanitizer.bypassSecurityTrustStyle(url);
            case 'script': return this.sanitizer.bypassSecurityTrustScript(url);
            case 'url': return this.sanitizer.bypassSecurityTrustUrl(url);
            case 'resourceUrl': return this.sanitizer.bypassSecurityTrustResourceUrl(url);
            default: throw new Error(`Invalid safe type specified: ${type}`);
        }
    }
}
