import {HttpClient} from '@angular/common/http';
import {EventEmitter, Injectable} from '@angular/core';
import {Database, ref, onValue, set} from '@angular/fire/database';
import {AuthService} from './auth.service';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  providerId?: string;
  createdAt: string;
  updatedAt: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'auto';
    notifications?: boolean;
    language?: string;
  };
}

@Injectable({
    providedIn: 'root'
})
export class UserProfileService {

    ref = null;
    DATABASE_PATH = null;
    public userProfileEvent = new EventEmitter<UserProfile>();
    private userProfile: UserProfile | null = null;

    constructor(
        private httpClient: HttpClient,
        private authService: AuthService,
        private fireDatabase: Database
    ) {
    }

    setupHandlers() {
        console.log('Setting up User Profile service..');
        
        try {
            if (!this.authService.isAuthenticated()) {
                console.error('Cannot setup user profile handlers: user not authenticated');
                return;
            }

            const userUID = this.authService.getUserUID();
            if (!userUID) {
                console.error('Cannot setup user profile handlers: no user UID');
                return;
            }

            // Setup DB PATH
            this.DATABASE_PATH = 'users/' + userUID + '/profile';
            // Subscribe to value changes
            onValue(ref(this.fireDatabase, this.DATABASE_PATH), (snapshot) => {
                const payload = snapshot.val() as UserProfile;
                console.log('User profile loaded from Firebase:', payload);
                
                if (payload) {
                    this.userProfile = payload;
                } else {
                    // Create default profile if none exists
                    this.createDefaultProfile(userUID);
                }
                
                // Always emit the event so the UI knows we've finished loading
                this.userProfileEvent.emit(this.userProfile);
            });
            console.log(this.DATABASE_PATH);
        } catch (error) {
            console.error('Error setting up user profile handlers:', error);
        }
    }

    private createDefaultProfile(userUID: string) {
        const currentUser = this.authService.getActiveUser();
        if (currentUser) {
            this.userProfile = {
                uid: userUID,
                email: currentUser.email || '',
                displayName: currentUser.displayName || '',
                photoURL: currentUser.photoURL || '',
                providerId: currentUser.providerData[0]?.providerId || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                preferences: {
                    theme: 'auto',
                    notifications: true,
                    language: 'en'
                }
            };
            this.updateDatabase();
        }
    }

    getUserProfile(): UserProfile | null {
        return this.userProfile;
    }

    updateProfile(profile: Partial<UserProfile>) {
        if (!this.userProfile) {
            console.error('Cannot update profile: no profile loaded');
            return Promise.reject('No profile loaded');
        }

        this.userProfile = {
            ...this.userProfile,
            ...profile,
            updatedAt: new Date().toISOString()
        };

        return this.updateDatabase();
    }

    updatePreferences(preferences: Partial<UserProfile['preferences']>) {
        if (!this.userProfile) {
            console.error('Cannot update preferences: no profile loaded');
            return Promise.reject('No profile loaded');
        }

        this.userProfile.preferences = {
            ...this.userProfile.preferences,
            ...preferences
        };
        this.userProfile.updatedAt = new Date().toISOString();

        return this.updateDatabase();
    }

    updateDatabase() {
        if (!this.DATABASE_PATH || !this.authService.isAuthenticated()) {
            console.error('Cannot update database: user not authenticated or no database path set');
            return Promise.reject('User not authenticated or no database path');
        }
        
        console.log('Updating database with user profile:', this.userProfile);
        const itemRef = ref(this.fireDatabase, this.DATABASE_PATH);
        
        return set(itemRef, this.userProfile)
            .then(() => {
                console.log('Successfully updated user profile in database');
            })
            .catch(e => {
                console.error('Failed to update user profile in database:', e);
                throw e;
            });
    }
}
