import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { LoginRequest, LoginResponse, RegisterRequest, UserProfile } from '../models/auth.model';

const TOKEN_KEY = 'eventosvivos_token';
const ROLE_KEY = 'eventosvivos_role';
const USER_ID_KEY = 'eventosvivos_user_id';
const USER_NAME_KEY = 'eventosvivos_user_name';
const USER_EMAIL_KEY = 'eventosvivos_user_email';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly isAuthenticated = signal(this.hasToken());
  readonly isAdmin = signal(this.getRole() === 'Admin');
  readonly currentUserName = signal(localStorage.getItem(USER_NAME_KEY) ?? '');
  readonly currentUserEmail = signal(localStorage.getItem(USER_EMAIL_KEY) ?? '');

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  login(credentials: LoginRequest) {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap(response => this.persistSession(response))
    );
  }

  register(request: RegisterRequest) {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/register`, request).pipe(
      tap(response => this.persistSession(response))
    );
  }

  getProfile() {
    return this.http.get<UserProfile>(`${environment.apiUrl}/auth/me`);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_NAME_KEY);
    localStorage.removeItem(USER_EMAIL_KEY);
    this.isAuthenticated.set(false);
    this.isAdmin.set(false);
    this.currentUserName.set('');
    this.currentUserEmail.set('');
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private persistSession(response: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(ROLE_KEY, response.role);
    localStorage.setItem(USER_ID_KEY, response.userId);
    localStorage.setItem(USER_NAME_KEY, response.fullName);
    localStorage.setItem(USER_EMAIL_KEY, response.email);
    this.isAuthenticated.set(true);
    this.isAdmin.set(response.role === 'Admin');
    this.currentUserName.set(response.fullName);
    this.currentUserEmail.set(response.email);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  }

  private getRole(): string | null {
    return localStorage.getItem(ROLE_KEY);
  }
}
