import { Injectable } from '@angular/core';
import {Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User, onAuthStateChanged} from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor(private fireAuth: Auth) {
    // Listen to auth state changes and update the subject
    onAuthStateChanged(this.fireAuth, (user) => {
      this.currentUserSubject.next(user);
    });
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254; // RFC 5321 limit
  }

  private validatePassword(password: string): boolean {
    // Minimum 8 characters, at least one letter and one number
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password) && password.length <= 128; // Reasonable max length
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

    return createUserWithEmailAndPassword(this.fireAuth, email.trim().toLowerCase(), password);
  }

  signin(email: string, password: string) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    if (!this.validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    return signInWithEmailAndPassword(this.fireAuth, email.trim().toLowerCase(), password);
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
