import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';  // adjust path

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

// import { Injectable } from '@angular/core';
// import { CanActivateFn, Router } from '@angular/router';
// import { AuthService } from '../services/auth.service';
// import { inject } from '@angular/core';

// @Injectable({ providedIn: 'root' })
// export class AuthGuard implements CanActivateFn {
//  constructor(private authService: AuthService, private router: Router) {}

//   canActivate(): boolean {
//     if (this.authService.isLoggedIn()) {
//       return true;
//     }
//     this.router.navigate(['/login']);
//     return false;
//     const authService = inject(AuthService);
//     const router = inject(Router);

//     if (!authService.isLoggedIn()) {
//       router.navigate(['/login']);
//       return false;
//     }

//     return true;
//   }
// }
