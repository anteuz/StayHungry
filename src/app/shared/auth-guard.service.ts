import {Injectable} from '@angular/core';
import { ActivatedRouteSnapshot, Route, RouterStateSnapshot, Router } from '@angular/router';
import {Observable, of} from 'rxjs';
import {AuthService} from '../services/auth.service';
import {Auth} from '@angular/fire/auth';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard {
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
        try {
            if (this.authService.isAuthenticated()) {
                return of(true);
            }
            this.navigateToSignIn();
            return of(false);
        } catch (error) {
            this.navigateToSignIn();
            return of(false);
        }
    }

    private navigateToSignIn(): void {
        try {
            const result = this.router.navigate(['/sign-in']);
            if (result && typeof (result as any).catch === 'function') {
                (result as any).catch((e: any) => console.error('AuthGuard: Error navigating to sign-in:', e));
            }
        } catch (e) {
            console.error('AuthGuard: Error navigating to sign-in:', e);
        }
    }
}
