import { Injectable } from '@angular/core';
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

  getToken() {

    const user = this.getActiveUser();
    return user ? await user.getIdToken() : null;
  }

  isAuthenticated(): boolean {
    return this.getActiveUser() !== null;
  }
}
