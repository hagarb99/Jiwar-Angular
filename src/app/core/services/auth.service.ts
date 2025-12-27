import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiBaseService } from './api-base.service';
import { CookieService } from 'ngx-cookie-service';
import { GoogleLoginProvider, SocialAuthService } from '@abacritt/angularx-social-login';
import { BehaviorSubject, Observable} from 'rxjs';

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
    this.isLoggedInSubject = new BehaviorSubject<boolean>(this.isLoggedIn());
    this.isLoggedIn$ = this.isLoggedInSubject.asObservable();
  }
  
  private isLoggedInSubject!: BehaviorSubject<boolean>;  
  isLoggedIn$!: Observable<boolean>;

private currentUserSubject = new BehaviorSubject<any>(null);
currentUser$ = this.currentUserSubject.asObservable();

setUserData(userData: {
  name: string;
  email: string;
  profilePicURL: string;
}) {
  this.currentUserSubject.next(userData);
  localStorage.setItem('currentUser', JSON.stringify(userData));
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
    this.cookieService.delete('token');
    this.clearUserData();
    this.isLoggedInSubject.next(false);
  }

  setToken(token: string) {
    this.cookieService.set('token', token);
    this.isLoggedInSubject.next(true);
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

  
  
}