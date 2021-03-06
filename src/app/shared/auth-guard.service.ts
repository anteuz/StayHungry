import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Route, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        return true;
    }

    canLoad(route: Route): Observable<boolean> | Promise<boolean> | boolean {
        return true;
    }
}
