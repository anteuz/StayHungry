import { Injectable } from '@angular/core';
import {Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User} from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private fireAuth: Auth) {}

  signup(email: string, password: string) {
    return createUserWithEmailAndPassword(this.fireAuth, email, password);
  }

  signin(email: string, password: string) {
    return signInWithEmailAndPassword(this.fireAuth, email, password);
  }

  logout() {
    signOut(this.fireAuth).catch(e => console.log('Could not logout'));
  }

  getActiveUser() {
    return this.fireAuth.currentUser;
  }

  getUserUID() {
    const user = this.getActiveUser();
    return user ? user.uid : null;
  }

  getToken() {
    const user = this.getActiveUser();
    return user ? user.getIdToken() : null;
  }

  isAuthenticated() {
    return this.getActiveUser() !== null;
  }
}
