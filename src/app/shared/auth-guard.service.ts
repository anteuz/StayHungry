import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, Route } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuthState(state.url);
  }

  canLoad(route: Route): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuthState();
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuthState(state.url);
  }

  /**
   * Check authentication state and redirect if necessary
   */
  private checkAuthState(redirectUrl?: string): Observable<boolean> {
    return this.authService.authState$.pipe(
      take(1),
      map(authState => {
        // If still loading, wait for auth state to resolve
        if (authState.isLoading) {
          return false;
        }

        // If authenticated, allow access
        if (authState.isAuthenticated && authState.user) {
          return true;
        }

        // If not authenticated, redirect to sign-in
        this.redirectToSignIn(redirectUrl);
        return false;
      })
    );
  }

  /**
   * Redirect to sign-in page with optional return URL
   */
  private redirectToSignIn(returnUrl?: string): void {
    const navigationExtras = returnUrl ? { queryParams: { returnUrl } } : {};
    
    this.router.navigate(['/sign-in'], navigationExtras).catch(error => {
      console.error('AuthGuard: Error navigating to sign-in:', error);
    });
  }
}