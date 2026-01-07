import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { router } from './app.routes';
import { MessageService } from 'primeng/api';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import {
  GoogleLoginProvider,
  SocialAuthServiceConfig
}
  from '@abacritt/angularx-social-login';


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    router,
    MessageService,

    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(
              '72525974366-ufpsn8ru6l45rf3ijfbped1shnvvjs2n.apps.googleusercontent.com'
            )
          }
        ],
        onError: (err: any) => { console.error('social login error', err) }
      } as SocialAuthServiceConfig
    }
  ]
};
