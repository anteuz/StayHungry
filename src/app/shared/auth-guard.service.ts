import {Injectable} from '@angular/core';
import { ActivatedRouteSnapshot, Route, RouterStateSnapshot, Router } from '@angular/router';
import {Observable, from} from 'rxjs';
import {map, catchError} from 'rxjs/operators';
import {AuthService} from '../services/auth.service';
import {Auth, onAuthStateChanged} from '@angular/fire/auth';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard  {
    constructor(
        private authService: AuthService,
        private router: Router,
        private fireAuth: Auth
    ) {}

    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        return this.checkAuth();
    }

    canLoad(route: Route): Observable<boolean> | Promise<boolean> | boolean {
        return this.checkAuth();
    }

    private checkAuth(): Observable<boolean> {
        return from(new Promise<boolean>((resolve) => {
            try {
                // Use onAuthStateChanged to wait for Firebase to initialize
                const unsubscribe = onAuthStateChanged(this.fireAuth, (user) => {
                    unsubscribe(); // Unsubscribe after first check
                    if (user) {
                        console.log('AuthGuard: User is authenticated');
                        resolve(true);
                    } else {
                        console.log('AuthGuard: User is not authenticated, redirecting to sign-in');
                        this.router.navigate(['/sign-in']).catch(e => {
                            console.error('AuthGuard: Error navigating to sign-in:', e);
                        });
                        resolve(false);
                    }
                }, (error) => {
                    console.error('AuthGuard: Error checking auth state:', error);
                    // On error, redirect to sign-in as a fallback
                    this.router.navigate(['/sign-in']).catch(e => {
                        console.error('AuthGuard: Error navigating to sign-in:', e);
                    });
                    resolve(false);
                });
            } catch (error) {
                console.error('AuthGuard: Unexpected error:', error);
                // On unexpected error, redirect to sign-in as a fallback
                this.router.navigate(['/sign-in']).catch(e => {
                    console.error('AuthGuard: Error navigating to sign-in:', e);
                });
                resolve(false);
            }
        }));
    }
}
