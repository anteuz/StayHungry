import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { 
  Auth, 
  User, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  UserCredential
} from '@angular/fire/auth';
import { UserStorageService } from './user-storage.service';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authState = new BehaviorSubject<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  public authState$ = this.authState.asObservable();

  constructor(
    private fireAuth: Auth,
    private userStorageService: UserStorageService
  ) {
    this.initAuthStateListener();
  }

  /**
   * Initialize Firebase auth state listener
   */
  private initAuthStateListener(): void {
    onAuthStateChanged(this.fireAuth, async (user) => {
      if (user) {
        await this.userStorageService.storeFromUser(user);
        this.authState.next({
          user,
          isAuthenticated: true,
          isLoading: false
        });
      } else {
        await this.userStorageService.clearUserData();
        this.authState.next({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    });
  }

  /**
   * Sign in with Google using popup (for web)
   */
  async signInWithGooglePopup(): Promise<UserCredential> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(this.fireAuth, provider);
      return result;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign in with Google using redirect (for mobile)
   */
  async signInWithGoogleRedirect(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      await signInWithRedirect(this.fireAuth, provider);
    } catch (error) {
      console.error('Google redirect sign-in error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Get redirect result after redirect sign-in
   */
  async getRedirectResult(): Promise<UserCredential | null> {
    try {
      return await getRedirectResult(this.fireAuth);
    } catch (error) {
      console.error('Get redirect result error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      await signOut(this.fireAuth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.fireAuth.currentUser;
  }

  /**
   * Get current user UID
   */
  getCurrentUserUID(): string | null {
    const user = this.getCurrentUser();
    return user?.uid || null;
  }

  /**
   * Get current user email
   */
  getCurrentUserEmail(): string | null {
    const user = this.getCurrentUser();
    return user?.email || null;
  }

  /**
   * Get current user display name
   */
  getCurrentUserDisplayName(): string | null {
    const user = this.getCurrentUser();
    return user?.displayName || null;
  }

  /**
   * Get current user photo URL
   */
  getCurrentUserPhotoURL(): string | null {
    const user = this.getCurrentUser();
    return user?.photoURL || null;
  }

  /**
   * Get current user ID token
   */
  async getCurrentUserToken(): Promise<string | null> {
    const user = this.getCurrentUser();
    if (!user) return null;
    
    try {
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting user token:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authState.value.isAuthenticated;
  }

  /**
   * Check if auth is loading
   */
  isLoading(): boolean {
    return this.authState.value.isLoading;
  }

  /**
   * Legacy method names for backward compatibility
   */
  getUserUID(): string | null {
    return this.getCurrentUserUID();
  }

  getActiveUser(): User | null {
    return this.getCurrentUser();
  }

  getUserEmail(): string | null {
    return this.getCurrentUserEmail();
  }

  async getToken(): Promise<string | null> {
    return this.getCurrentUserToken();
  }

  async logout(): Promise<void> {
    return this.signOut();
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: any): Error {
    let message = 'Authentication failed. Please try again.';
    
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        message = 'Sign-in was cancelled. Please try again.';
        break;
      case 'auth/popup-blocked':
        message = 'Pop-up was blocked by your browser. Please allow pop-ups and try again.';
        break;
      case 'auth/cancelled-popup-request':
        message = 'Sign-in was cancelled. Please try again.';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection and try again.';
        break;
      case 'auth/too-many-requests':
        message = 'Too many requests. Please wait a moment and try again.';
        break;
      case 'auth/user-disabled':
        message = 'This account has been disabled. Please contact support.';
        break;
      default:
        console.error('Unhandled auth error:', error);
        break;
    }
    
    return new Error(message);
  }
}