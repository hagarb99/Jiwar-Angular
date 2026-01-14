import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ApiBaseService } from './api-base.service';
import { GoogleLoginProvider, SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap, distinctUntilChanged } from 'rxjs/operators';

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
  token: string;
  id: string;
  name: string;
  email: string;
  profilePicURL: string;
  role: string;
  isProfileCompleted: boolean;
}

export interface GoogleLoginBackendResponse {
  success: boolean;
  data: {
    token: string;
    id: string;
    name: string;
    email: string;
    profilePicURL: string;
    role: string;
    isProfileCompleted: boolean;
  };
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}


export interface UserData {
  id: string;
  name: string;
  email: string;
  profilePicURL: string;
  role: string;
  isProfileCompleted: boolean;
  phoneNumber?: string; // Optional field
}


@Injectable({ providedIn: 'root' })
export class AuthService extends ApiBaseService {
  private isLoggedInSubject: BehaviorSubject<boolean>;
  public isLoggedIn$: Observable<boolean>;

  private currentUserSubject: BehaviorSubject<UserData | null>;
  public currentUser$: Observable<UserData | null>;

  constructor(
    http: HttpClient,
    private socialAuthService: SocialAuthService
  ) {
    super(http);

    // Initialize observables
    const initialUser = this.loadUserFromStorage();
    const hasToken = !!this.getToken();

    this.currentUserSubject = new BehaviorSubject<UserData | null>(initialUser);
    this.currentUser$ = this.currentUserSubject.asObservable().pipe(
      distinctUntilChanged((prev: UserData | null, curr: UserData | null) => JSON.stringify(prev) === JSON.stringify(curr))
    );

    this.isLoggedInSubject = new BehaviorSubject<boolean>(hasToken && !!initialUser);
    this.isLoggedIn$ = this.isLoggedInSubject.asObservable().pipe(distinctUntilChanged());
  }


  login(data: LoginRequest): Observable<LoginResponse> {
    return this.httpClient.post<LoginResponse>(
      `${this.apiBaseUrl}/account/login`,
      data
    ).pipe(
      tap(response => {
        console.log('[AuthService] Login successful:', { ...response, token: '***' });
        this.validateAndStoreAuth(response);
      }),
      catchError(this.handleError)
    );
  }

  googleBackendLogin(idToken: string): Observable<LoginResponse> {
    return this.httpClient.post<any>(
      `${this.apiBaseUrl}/account/google-signin`,
      { IdToken: idToken }
    ).pipe(
      map(response => this.normalizeGoogleResponse(response)),
      tap(normalized => {
        console.log('[AuthService] Google login successful:', { ...normalized, token: '***' });
        this.validateAndStoreAuth(normalized);
      }),
      catchError(this.handleError)
    );
  }

  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.httpClient.post<RegisterResponse>(
      `${this.apiBaseUrl}/account/register`,
      data
    ).pipe(
      catchError(this.handleError)
    );
  }


  changePassword(data: ChangePasswordRequest): Observable<ChangePasswordResponse> {
    return this.httpClient.post<ChangePasswordResponse>(
      `${this.apiBaseUrl}/account/change-password`,
      data
    ).pipe(
      catchError(this.handleError)
    );
  }

  forgotPassword(data: ForgotPasswordRequest): Observable<ForgotPasswordResponse> {
    return this.httpClient.post<ForgotPasswordResponse>(
      `${this.apiBaseUrl}/account/forgot-password`,
      data
    ).pipe(
      catchError(this.handleError)
    );
  }


  logout(): void {
    console.log('[AuthService] Logging out user');
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
  }

  googleLogin(): Promise<SocialUser> {
    return this.socialAuthService.signIn(GoogleLoginProvider.PROVIDER_ID);
  }


  setToken(token: string): void {
    if (!token || token.trim() === '') {
      console.error('[AuthService] Attempted to set invalid token');
      return;
    }
    localStorage.setItem('token', token);
    this.isLoggedInSubject.next(true);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    const user = this.currentUserSubject.value;
    return !!token && !!user;
  }


  setUserData(userData: UserData): void {
    if (!userData || !userData.id || !userData.email) {
      console.error('[AuthService] Attempted to set invalid user data:', userData);
      return;
    }

    this.currentUserSubject.next(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
  }

  updateUserFromProfile(profileData: Partial<UserData>): void {
    const currentUser = this.currentUserSubject.value;
    if (!currentUser) return;

    const updatedUser: UserData = {
      ...currentUser,
      name: profileData.name ?? currentUser.name,
      email: profileData.email ?? currentUser.email,
      profilePicURL: profileData.profilePicURL ?? currentUser.profilePicURL,
      phoneNumber: profileData.phoneNumber ?? currentUser.phoneNumber
    };

    this.currentUserSubject.next(updatedUser);

    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  }



  uploadProfilePicture(file: File): Observable<{ profilePicURL: string }> {
    const formData = new FormData();

    formData.append('image', file);

    return this.httpClient.post<{ profilePicURL: string }>(
      `${this.apiBaseUrl}/account/profile/upload-image`,
      formData
    ).pipe(
      catchError(this.handleError)
    );
  }


  clearUserData(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('currentUser');
  }


  setAuthData(response: LoginResponse): void {
    this.setToken(response.token);

    this.setUserData({
      id: response.id,
      name: response.name,
      email: response.email,
      profilePicURL: response.profilePicURL || '',
      role: response.role,
      isProfileCompleted: response.isProfileCompleted
    });

    this.isLoggedInSubject.next(true);
  }


  get userRole(): string | null {
    const user = this.currentUserSubject.value || this.loadUserFromStorage();
    return user?.role ?? null;
  }

  getUserName(): string | null {
    const user = this.currentUserSubject.value || this.loadUserFromStorage();
    return user?.name ?? null;
  }

  getUserEmail(): string | null {
    const user = this.currentUserSubject.value || this.loadUserFromStorage();
    return user?.email ?? null;
  }

  getProfilePicUrl(): string | null {
    const user = this.currentUserSubject.value || this.loadUserFromStorage();
    return user?.profilePicURL ?? null;
  }

  getUserId(): string | null {
    const user = this.currentUserSubject.value || this.loadUserFromStorage();
    return user?.id ?? null;
  }

  getCurrentUserValue(): UserData | null {
    return this.currentUserSubject.value;
  }

  private loadUserFromStorage(): UserData | null {
    try {
      const userJson = localStorage.getItem('currentUser');
      if (!userJson) return null;

      const user = JSON.parse(userJson);

      // Validate required fields
      if (!user.id || !user.email || !user.role) {
        console.warn('[AuthService] Invalid user data in storage, clearing');
        localStorage.removeItem('currentUser');
        return null;
      }

      return user as UserData;
    } catch (error) {
      console.error('[AuthService] Error loading user from storage:', error);
      localStorage.removeItem('currentUser');
      return null;
    }
  }


  private validateAndStoreAuth(response: LoginResponse): void {
    if (!response.token) {
      throw new Error('No token in response');
    }

    if (!response.id || !response.email || !response.role) {
      throw new Error('Incomplete user data in response');
    }

    this.setToken(response.token);

    const userData: UserData = {
      id: response.id,
      name: response.name,
      email: response.email,
      profilePicURL: response.profilePicURL || '',
      role: response.role,
      isProfileCompleted: response.isProfileCompleted
    };

    this.setUserData(userData);
  }


  private normalizeGoogleResponse(response: any): LoginResponse {
    const success = response.success ?? response.Success;
    const data = response.data ?? response.Data;

    if (!success || !data) {
      throw new Error('Invalid Google login response structure');
    }

    return {
      token: data.token ?? data.Token,
      id: data.id ?? data.Id,
      name: data.name ?? data.Name,
      email: data.email ?? data.Email,
      profilePicURL: data.profilePicURL ?? data.ProfilePicURL ?? '',
      role: data.role ?? data.Role,
      isProfileCompleted: data.isProfileCompleted ?? data.IsProfileCompleted ?? false
    };
  }


  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Network error: ${error.error.message}`;
    } else {
      if (error.status === 0) {
        errorMessage = 'Unable to connect to server. Please check your connection.';
      } else if (error.status === 401) {
        errorMessage = error.error?.message || 'Invalid credentials';
      } else if (error.status === 400) {
        errorMessage = error.error?.message || 'Invalid request';
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = error.error?.message || `Error: ${error.status}`;
      }
    }

    console.error('[AuthService] Error:', {
      status: error.status,
      message: errorMessage,
      error: error.error
    });

    return throwError(() => ({
      status: error.status,
      message: errorMessage,
      originalError: error
    }));
  }
}