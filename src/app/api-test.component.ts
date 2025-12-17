// import { Component } from '@angular/core';
// import { AuthService } from './core/services/auth.service';

// @Component({
//   standalone: true,
//   selector: 'app-api-test',
//   template: `<button (click)="testLogin()">Test Login API</button>`
// })
// export class ApiTestComponent {

//   constructor(private authService: AuthService) {}

//   testLogin(): void {
//     this.authService.login({
//       email: 'test@test.com',
//       password: '123456'
//     }).subscribe({
//       next: response => {
//         console.log('LOGIN OK', response);
//         this.authService.setToken(response.token);
//       },
//       error: error => console.error('LOGIN ERROR', error)
//     });
//   }
// }
