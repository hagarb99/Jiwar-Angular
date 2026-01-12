import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { AuthInterceptor } from './app/core/interceptors/auth.interceptor';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { LoadingInterceptor } from './app/core/interceptors/LoadingInterceptor';
bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),
    provideHttpClient(
      withInterceptorsFromDi()
    ),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingInterceptor,
      multi: true
    },
    CookieService,
    providePrimeNG({
      theme: {
        preset: Aura
      }
    })
  ]
})
  .catch((err: any) => console.error(err));