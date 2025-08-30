import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import type { User, UserCredential } from 'firebase/auth';

export interface UserData {
  email: string;
  uid: string;
  displayName?: string;
  photoURL?: string;
  providerId?: string;
  lastLogin?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class UserStorageService {
  private storage: Storage | null = null;
  private readonly USER_DATA_KEY = 'user_data';

  constructor(private ionicStorage: Storage) {
    this.init();
  }

  async init() {
    this.storage = await this.ionicStorage.create();
  }

  async storeUserData(userData: UserData): Promise<void> {
    if (!this.storage) {
      await this.init();
    }
    const storage = this.storage;
    if (!storage) {
      throw new Error('UserStorageService: Storage not initialized after init()');
    }
    await storage.set(this.USER_DATA_KEY, userData);
  }

  async getUserData(): Promise<UserData | null> {
    if (!this.storage) {
      await this.init();
    }
    const storage = this.storage;
    if (!storage) {
      throw new Error('UserStorageService: Storage not initialized after init()');
    }
    return await storage.get(this.USER_DATA_KEY) || null;
  }

  async getUserEmail(): Promise<string | null> {
    const userData = await this.getUserData();
    return userData?.email || null;
  }

  async clearUserData(): Promise<void> {
    if (!this.storage) {
      await this.init();
    }
    const storage = this.storage;
    if (!storage) {
      throw new Error('UserStorageService: Storage not initialized after init()');
    }
    await storage.remove(this.USER_DATA_KEY);
  }

  async updateLastLogin(): Promise<void> {
    const userData = await this.getUserData();
    if (userData) {
      userData.lastLogin = new Date();
      await this.storeUserData(userData);
    }
  }

  async storeFromUser(user: User): Promise<void> {
    const userData: UserData = {
      email: user.email || '',
      uid: user.uid,
      displayName: user.displayName || undefined,
      photoURL: user.photoURL || undefined,
      providerId: user.providerData[0]?.providerId || undefined,
      lastLogin: new Date()
    };
    await this.storeUserData(userData);
  }

  async storeFromCredential(cred: UserCredential): Promise<void> {
    await this.storeFromUser(cred.user);
  }
}
