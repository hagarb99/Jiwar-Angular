import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

export type Language = 'en' | 'ar';

@Injectable({
    providedIn: 'root'
})
export class TranslationService {
    private languageSubject: BehaviorSubject<Language>;
    public language$: Observable<Language>;

    private translations: any = {
        en: {
            'nav.sell': 'Sell',
            'nav.buy': 'Buy',
            'nav.invest': 'Invest',
            'nav.renovation': 'Renovation',
            'nav.pricing': 'Pricing',
            'nav.explore': 'Explore Properties',
            'nav.login': 'Login',
            'nav.join': 'Join',
            'nav.dashboard': 'Dashboard',
            'nav.subscriptions': 'Subscriptions',
            'nav.changePassword': 'Change Password',
            'nav.logout': 'Logout',
            'nav.notifications': 'Notifications',
            'nav.markRead': 'Mark all as read',
            'nav.noNotifications': 'No notifications',
            'nav.search': 'Search Properties...',
            'nav.apartmentsSale': 'Apartments for Sale',
            'nav.apartmentsRent': 'Apartments for Rent',
            'nav.newDevelopments': 'New Developments',
            'nav.virtualTours': 'Virtual Tour Properties (360°)',
            'nav.compare': 'Compare Properties',
            'nav.featured': 'Featured Properties',
            'home.heroTitle': 'Find Your Dream Home with AI',
            'home.heroSub': 'The next generation of real estate search and investment powered by artificial intelligence.',
        },
        ar: {
            'nav.sell': 'بيع',
            'nav.buy': 'شراء',
            'nav.invest': 'استثمار',
            'nav.renovation': 'تجديد',
            'nav.pricing': 'الأسعار',
            'nav.explore': 'استكشف العقارات',
            'nav.login': 'تسجيل الدخول',
            'nav.join': 'انضم إلينا',
            'nav.dashboard': 'لوحة التحكم',
            'nav.subscriptions': 'الاشتراكات',
            'nav.changePassword': 'تغيير كلمة المرور',
            'nav.logout': 'تسجيل الخروج',
            'nav.notifications': 'الإشعارات',
            'nav.markRead': 'تحديد الكل كمقروء',
            'nav.noNotifications': 'لا توجد إشعارات',
            'nav.search': 'ابحث عن عقارات...',
            'nav.apartmentsSale': 'شقق للبيع',
            'nav.apartmentsRent': 'شقق للإيجار',
            'nav.newDevelopments': 'مشاريع جديدة',
            'nav.virtualTours': 'عقارات بجولة افتراضية (360 درجة)',
            'nav.compare': 'قارن العقارات',
            'nav.featured': 'عقارات مميزة',
            'home.heroTitle': 'ابحث عن منزل أحلامك بالذكاء الاصطناعي',
            'home.heroSub': 'الجيل القادم من البحث عن العقارات والاستثمار المدعوم بالذكاء الاصطناعي.',
        }
    };

    constructor(@Inject(PLATFORM_ID) private platformId: Object) {
        let initialLang: Language = 'en';

        if (isPlatformBrowser(this.platformId)) {
            const savedLang = localStorage.getItem('preferredLanguage') as Language;
            if (savedLang === 'en' || savedLang === 'ar') {
                initialLang = savedLang;
            }
        }

        this.languageSubject = new BehaviorSubject<Language>(initialLang);
        this.language$ = this.languageSubject.asObservable();

        // Initialize the UI on startup
        this.applyLanguage(initialLang);
    }

    public translate(key: string): string {
        const lang = this.languageSubject.value;
        return this.translations[lang][key] || key;
    }

    public setLanguage(lang: Language): void {
        if (this.languageSubject.value === lang) {
            return;
        }

        this.languageSubject.next(lang);
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('preferredLanguage', lang);
        }
        this.applyLanguage(lang);
    }

    public getCurrentLanguage(): Language {
        return this.languageSubject.value;
    }

    private applyLanguage(lang: Language): void {
        if (!isPlatformBrowser(this.platformId)) return;

        const dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.dir = dir;
        document.documentElement.lang = lang;

        // Also apply to body just in case some CSS relies on it
        document.body.dir = dir;
    }
}
