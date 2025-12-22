import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiBaseService } from './api-base.service';
import { CookieService } from 'ngx-cookie-service';
import { GoogleLoginProvider, SocialAuthService } from '@abacritt/angularx-social-login';

export interface RegisterRequest {
  username: string;
  name: string;
  email: string;
  password: string;
  role: string;
  phoneNumber: string;
}

export interface RegisterResponse {
  id: string;
  name: string;
  email: string;
  role: string;
}


export interface LoginRequest {
  email: string;
  password: string;
}
export interface LoginResponse {
  id: string;
  name: string;
  email: string;
  profilePicURL: string;
  role: string;
  token: string;
  isProfileCompleted: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService extends ApiBaseService {

  constructor(http: HttpClient, private cookieService: CookieService,
    private socialAuthService: SocialAuthService
  ) {
    super(http);
  }
  
googleBackendLogin(idToken: string) {
  return this.httpClient.post(`/api/account/google-signin`, { IdToken: idToken });
}

  register(data: RegisterRequest) {
    return this.httpClient.post<RegisterResponse>(
      // `${this.apiBaseUrl}/account/register`
      `/api/account/register`,
      data
    );
  }

  login(data: LoginRequest) {
    return this.httpClient.post<LoginResponse>(
      // `${this.apiBaseUrl}/account/login`
      `/api/account/login`,
      data
    );
  }

  logout() {
    this.cookieService.delete('token');
  }

  setToken(token: string) {
    this.cookieService.set('token', token);
  }

  getToken(): string | null {
    return this.cookieService.get('token');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token;
  }
  googleLogin() {
    return this.socialAuthService.signIn(GoogleLoginProvider.PROVIDER_ID);
  }

  // googleBackendLogin(idToken: string) {
  //   return this.httpClient.post<any>(
  //     `${this.apiBaseUrl}/auth/google-signin`,
  //     idToken,
  //     {
  //       headers: { 'Content-Type': 'application/json' }
  //     }
  //   );
  // }


  
}