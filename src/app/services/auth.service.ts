import { Injectable } from '@angular/core';
import {Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult} from '@angular/fire/auth';
import { UserStorageService } from './user-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private fireAuth: Auth,
    private userStorageService: UserStorageService
  ) {}

  signup(email: string, password: string) {
    return createUserWithEmailAndPassword(this.fireAuth, email, password);
  }

  signin(email: string, password: string) {
    return signInWithEmailAndPassword(this.fireAuth, email, password);
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

  getActiveUser() {
    return this.fireAuth.currentUser;
  }

  getUserUID() {
    const user = this.getActiveUser();
    return user ? user.uid : null;
  }

  getUserEmail() {
    const user = this.getActiveUser();
    return user ? user.email : null;
  }

  getToken() {
    const user = this.getActiveUser();
    return user ? user.getIdToken() : null;
  }

  isAuthenticated() {
    return this.getActiveUser() !== null;
  }
}
