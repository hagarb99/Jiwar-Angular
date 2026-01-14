import { Directive, Input, ElementRef, HostListener, OnChanges, SimpleChanges, OnInit, Renderer2 } from '@angular/core';

@Directive({
    selector: 'img[appImgFallback]',
    standalone: true
})
export class ImgFallbackDirective implements OnInit, OnChanges {
    @Input('appImgFallback') fallbackUrl: string = '/assets/placeholder.jpg';
    private fallbackApplied = false;

    constructor(private el: ElementRef, private renderer: Renderer2) { }

    ngOnInit() {
        this.validateImage();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['fallbackUrl']) {
            this.fallbackApplied = false;
            this.validateImage();
        }
    }

    @HostListener('error')
    onError() {
        if (!this.fallbackApplied) {
            this.setFallback();
        }
    }

    private validateImage() {
        const element = this.el.nativeElement as HTMLImageElement;
        // Check if src is missing or effectively empty
        if (!element.src || element.src.trim() === '' || element.src === window.location.href) {
            this.setFallback();
        }
    }

    private setFallback() {
        this.fallbackApplied = true;
        this.renderer.setAttribute(this.el.nativeElement, 'src', this.fallbackUrl);
    }
}
