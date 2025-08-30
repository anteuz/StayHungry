import {Injectable} from '@angular/core';
import { ActivatedRouteSnapshot, Route, RouterStateSnapshot, Router } from '@angular/router';
import {Observable, of} from 'rxjs';
import {first, map, catchError} from 'rxjs/operators';
import {AuthService} from '../services/auth.service';
import {Auth, authState} from '@angular/fire/auth';

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
        return authState(this.fireAuth).pipe(
            first(),
            map(user => {
                if (user) {
                    console.log('AuthGuard: User is authenticated');
                    return true;
                } else {
                    console.log('AuthGuard: User is not authenticated, redirecting to sign-in');
                    this.router.navigate(['/sign-in']).catch(e => {
                        console.error('AuthGuard: Error navigating to sign-in:', e);
                    });
                    return false;
                }
            }),
            catchError(error => {
                console.error('AuthGuard: Error checking auth state:', error);
                this.router.navigate(['/sign-in']).catch(e => {
                    console.error('AuthGuard: Error navigating to sign-in:', e);
                });
                return of(false);
            })
        );
    }
}
