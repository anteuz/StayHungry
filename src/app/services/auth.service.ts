import { Injectable } from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import * as firebase from 'firebase/app';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private fireAuth: AngularFireAuth) {}

  signup(email: string, password: string) {
    return this.fireAuth.auth.createUserWithEmailAndPassword(email, password);
  }

  signin(email: string, password: string) {
    return this.fireAuth.auth.signInWithEmailAndPassword(email, password);
  }

  logout() {
    this.fireAuth.auth.signOut().catch(e => console.log('Could not logout'));
  }

  getActiveUser() {
    let activeUser: firebase.User = null;
    activeUser = this.fireAuth.auth.currentUser;
    return activeUser;
  }

  getUserUID() {
    return this.getActiveUser().uid;
  }

  getToken() {
    return this.getActiveUser().getIdToken();
  }
}
