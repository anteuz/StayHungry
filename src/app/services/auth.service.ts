import { Injectable } from '@angular/core';
import {Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User, onAuthStateChanged} from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';
import { ValidationUtils } from '../utils/validation.utils';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor(private fireAuth: Auth) {
    // Listen to auth state changes and update the subject
    if (this.fireAuth) {
      onAuthStateChanged(this.fireAuth, (user) => {
        this.currentUserSubject.next(user);
      });
    }
  }

  private validateEmail(email: string): boolean {
    return ValidationUtils.validateEmail(email);
  }

  private validatePassword(password: string): boolean {
    return ValidationUtils.validatePassword(password);
  }

  signup(email: string, password: string) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    if (!this.validateEmail(email)) {
      throw new Error('Invalid email format');
    }
    
    if (!this.validatePassword(password)) {
      throw new Error('Password must be at least 8 characters with letters and numbers');
    }

    return createUserWithEmailAndPassword(this.fireAuth, ValidationUtils.sanitizeEmail(email), password);
  }

  signin(email: string, password: string) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    if (!this.validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    return signInWithEmailAndPassword(this.fireAuth, ValidationUtils.sanitizeEmail(email), password);
  }

  logout() {
    return signOut(this.fireAuth);
  }

  getActiveUser(): User | null {
    return this.fireAuth.currentUser;
  }

  getUserUID(): string | null {
    const user = this.getActiveUser();
    return user ? user.uid : null;
  }

  async getToken(): Promise<string | null> {
    const user = this.getActiveUser();
    return user ? await user.getIdToken() : null;
  }

  isAuthenticated(): boolean {
    return this.getActiveUser() !== null;
  }
}
