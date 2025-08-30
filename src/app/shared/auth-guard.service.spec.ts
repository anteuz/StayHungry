import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGuard } from './auth-guard.service';
import { AuthService } from '../services/auth.service';
import { Auth } from '@angular/fire/auth';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: { isAuthenticated: jest.fn().mockReturnValue(false) } },
        { provide: Router, useValue: { navigate: jest.fn().mockReturnValue({ catch: jest.fn() }) } },
        { provide: Auth, useValue: { currentUser: null } }
      ]
    });

    guard = TestBed.inject(AuthGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});