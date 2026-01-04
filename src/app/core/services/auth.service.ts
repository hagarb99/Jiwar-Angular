import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiBaseService } from './api-base.service';
import { GoogleLoginProvider, SocialAuthService } from '@abacritt/angularx-social-login';
import { BehaviorSubject, Observable } from 'rxjs';

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
  constructor(http: HttpClient,
    private socialAuthService: SocialAuthService
  ) {
    super(http);
    this.isLoggedInSubject = new BehaviorSubject<boolean>(this.isLoggedIn());
    this.isLoggedIn$ = this.isLoggedInSubject.asObservable();
  }

  private isLoggedInSubject!: BehaviorSubject<boolean>;
  isLoggedIn$!: Observable<boolean>;

  private currentUserSubject = new BehaviorSubject<any>(this.loadUserFromStorage());
  currentUser$ = this.currentUserSubject.asObservable();

  private loadUserFromStorage(): any {
    try {
      const userJson = localStorage.getItem('currentUser');
      return userJson ? JSON.parse(userJson) : null;
    } catch {
      return null;
    }
  }

  setUserData(userData: {
    id: string;
    name: string;
    email: string;
    profilePicURL: string;
    role?: string;
    isProfileCompleted: boolean;
  }) {
    this.currentUserSubject.next(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
  }

  setAuthData(response: LoginResponse): void {
    this.setToken(response.token);

    this.setUserData({
      id: response.id,
      name: response.name,
      email: response.email,
      profilePicURL: response.profilePicURL,
      role: response.role,
      isProfileCompleted: response.isProfileCompleted
    });

    this.isLoggedInSubject.next(true);
  }

  get userRole(): string | null {
    const user =
      this.currentUserSubject.value ??
      JSON.parse(localStorage.getItem('currentUser') || 'null');

    return user?.role ?? null;
  }


  getUserName(): string | null {
    const user = this.currentUserSubject.value || JSON.parse(localStorage.getItem('currentUser') || 'null');
    return user?.name || null;
  }

  getUserEmail(): string | null {
    const user = this.currentUserSubject.value || JSON.parse(localStorage.getItem('currentUser') || 'null');
    return user?.email || null;
  }

  getProfilePicUrl(): string | null {
    const user = this.currentUserSubject.value || JSON.parse(localStorage.getItem('currentUser') || 'null');
    return user?.profilePicURL || null;
  }

  getUserId(): string | null {
    const user = this.currentUserSubject.value || JSON.parse(localStorage.getItem('currentUser') || 'null');
    return user?.id || null;
  }

  clearUserData() {
    this.currentUserSubject.next(null);
    localStorage.removeItem('currentUser');
  }

  googleBackendLogin(idToken: string) {
    return this.httpClient.post(`${this.apiBaseUrl}/account/google-signin`, { IdToken: idToken });
  }

  register(data: RegisterRequest) {
    return this.httpClient.post<RegisterResponse>(
      `${this.apiBaseUrl}/account/register`,
      data
    );
  }

  login(data: LoginRequest) {
    return this.httpClient.post<LoginResponse>(
      `${this.apiBaseUrl}/account/login`,
      data
    );
  }

  logout() {
    localStorage.removeItem('token');
    this.clearUserData();
    this.isLoggedInSubject.next(false);
  }

  setToken(token: string) {
    localStorage.setItem('token', token);
    this.isLoggedInSubject.next(true);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token;
  }
  googleLogin() {
    return this.socialAuthService.signIn(GoogleLoginProvider.PROVIDER_ID);
  }



}