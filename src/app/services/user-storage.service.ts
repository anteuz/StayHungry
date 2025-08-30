import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UserStorageService {
    async getUserEmail(): Promise<string | null> {
        try {
            const email = localStorage.getItem('userEmail');
            return email ? email : null;
        } catch {
            return null;
        }
    }
}

