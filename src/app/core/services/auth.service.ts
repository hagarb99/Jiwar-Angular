import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiBaseService } from './api-base.service';
import { CookieService } from 'ngx-cookie-service';

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

  constructor(http: HttpClient, private cookieService: CookieService) {
    super(http);
  }

  login(data: LoginRequest) {
    return this.httpClient.post<{
      success: boolean;
      message: string;
      data: LoginResponse;
    }>(`${this.apiBaseUrl}/account/login`, data);
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
}