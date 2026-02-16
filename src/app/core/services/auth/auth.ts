import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

/**
 * Interface pour la requête de login
 */
export interface LoginRequest {
  username: string;
  password: string;
  recaptchaToken: string;
}

/**
 * Interface pour la réponse JWT
 */
export interface JwtResponse {
  token: string;
  type?: string;
  id?: string;
  username: string;
  email?: string;
  roles?: string[];
}

/**
 * Interface pour les messages d'erreur
 */
export interface MessageResponse {
  message: string;
}

/**
 * Service d'authentification pour Angular 20
 * Gère les appels API de login avec reCAPTCHA
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  
  private readonly API_URL = environment.apiUrl;
  private readonly AUTH_ENDPOINT = `${this.API_URL}/api/auth`;
  
  // BehaviorSubject pour gérer l'état de connexion
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // BehaviorSubject pour l'utilisateur courant
  private currentUserSubject = new BehaviorSubject<JwtResponse | null>(this.getCurrentUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  /**
   * Authentifie un utilisateur avec reCAPTCHA
   * 
   * @param username Nom d'utilisateur
   * @param password Mot de passe
   * @param recaptchaToken Token reCAPTCHA
   * @returns Observable<JwtResponse>
   */
  login(username: string, password: string, recaptchaToken: string): Observable<JwtResponse> {
    const loginRequest: LoginRequest = {
      username,
      password,
      recaptchaToken
    };

    return this.http.post<JwtResponse>(`${this.AUTH_ENDPOINT}/login`, loginRequest)
      .pipe(
        tap(response => {
          // Sauvegarder le token dans le localStorage
          this.saveToken(response.token);
          this.saveUser(response);
          
          // Mettre à jour les BehaviorSubjects
          this.isAuthenticatedSubject.next(true);
          this.currentUserSubject.next(response);
          
          console.log('Login successful for:', response.username);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Déconnecte l'utilisateur
   */
  logout(): void {
    if (typeof window !== 'undefined') {
    // Supprimer le token et les infos utilisateur
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    }
    
    // Mettre à jour les BehaviorSubjects
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
    
    console.log('User logged out');
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   * 
   * @returns boolean
   */
  isLoggedIn(): boolean {
    return this.hasToken();
  }

  /**
   * Récupère le token JWT
   * 
   * @returns string | null
   */
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  /**
   * Récupère l'utilisateur courant
   * 
   * @returns JwtResponse | null
   */
  getCurrentUserValue(): JwtResponse | null {
    return this.currentUserSubject.value;
  }

  /**
   * Sauvegarde le token dans le localStorage
   * 
   * @param token Token JWT
   */
  private saveToken(token: string): void {
    if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
  }

  /**
   * Sauvegarde les informations utilisateur
   * 
   * @param user Informations utilisateur
   */
  private saveUser(user: JwtResponse): void {
    if (typeof window !== 'undefined') {
    localStorage.setItem('current_user', JSON.stringify(user));
    }
  }

  /**
   * Vérifie si un token existe
   * 
   * @returns boolean
   */
  private hasToken(): boolean {
    return !!this.getToken();
  }

  /**
   * Récupère l'utilisateur depuis le localStorage
   * 
   * @returns JwtResponse | null
   */
  private getCurrentUser(): JwtResponse | null {
    if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('current_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing user from localStorage', e);
        return null;
      }
    }
    return null;
    }
    return null;
  }

  /**
   * Gestion des erreurs HTTP
   * 
   * @param error HttpErrorResponse
   * @returns Observable<never>
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 401) {
        errorMessage = 'Invalid credentials';
      } else if (error.status === 400) {
        errorMessage = error.error?.message || 'Bad request';
      } else if (error.status === 0) {
        errorMessage = 'Cannot connect to server';
      } else {
        errorMessage = `Server error: ${error.status}`;
      }
    }

    console.error('Authentication error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}