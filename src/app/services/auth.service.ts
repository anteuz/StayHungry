import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ValidationUtils } from '../utils/validation.utils';
import {Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult} from '@angular/fire/auth';
import { UserStorageService } from './user-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor(
    private fireAuth: Auth,
    private userStorageService: UserStorageService
  ) {}

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validatePassword(password: string): boolean {
    return password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password);
  }

  private sanitizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  signup(email: string, password: string) {
    if (!email || !password) {
      return Promise.reject(new Error('Email and password are required'));
    }
    
    if (!ValidationUtils.validateEmail(email)) {
      return Promise.reject(new Error('Invalid email format'));
    }
    
    if (!ValidationUtils.validatePassword(password)) {
      return Promise.reject(new Error('Password must be at least 8 characters with letters and numbers'));
    }

    return createUserWithEmailAndPassword(this.fireAuth, this.sanitizeEmail(email), password);
  }

  signin(email: string, password: string) {
    if (!email || !password) {
      return Promise.reject(new Error('Email and password are required'));
    }
    
    if (!ValidationUtils.validateEmail(email)) {
      return Promise.reject(new Error('Invalid email format'));
    }

    return signInWithEmailAndPassword(this.fireAuth, this.sanitizeEmail(email), password);
  }

  // Expose validators for tests (thin wrappers around ValidationUtils)
  validateEmail(email: string): boolean {
    return ValidationUtils.validateEmail(email);
  }

  validatePassword(password: string): boolean {
    return ValidationUtils.validatePassword(password);
  }

  signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.fireAuth, provider);
  }

  signUpWithGoogle() {
    // Google sign-in handles both sign-in and sign-up automatically
    return this.signInWithGoogle();
  }

  getRedirectResult() {
    return getRedirectResult(this.fireAuth);
  }

  async logout() {
    try {
      await signOut(this.fireAuth);
      await this.userStorageService.clearUserData();
    } catch (e) {
      console.log('Could not logout:', e);
    }
  }

  getActiveUser(): User | null {
    return this.fireAuth.currentUser;
  }

  getUserUID(): string | null {
    const user = this.getActiveUser();
    return user ? user.uid : null;
  }

  getUserEmail() {
    const user = this.getActiveUser();
    return user ? user.email : null;
  }


  async getToken() {
    const user = this.getActiveUser();
    return user ? await user.getIdToken() : null;
  }

  isAuthenticated(): boolean {
    return this.getActiveUser() !== null;
  }
}
