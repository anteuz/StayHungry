import { TestBed } from '@angular/core/testing';

import { AuthGuard } from './auth-guard.service';

describe('AuthGuard', () => {
  beforeEach(() => {
    // Initialize Angular testing environment
    try {
      const testing = require('@angular/core/testing');
      const platform = require('@angular/platform-browser-dynamic/testing');
      if (!(testing as any).getTestBed().ngModule)
        (testing as any).TestBed.initTestEnvironment(platform.BrowserDynamicTestingModule, platform.platformBrowserDynamicTesting());
    } catch {}

    TestBed.configureTestingModule({
      providers: [AuthGuard, { provide: AuthService, useValue: { isAuthenticated: jest.fn().mockReturnValue(true) } }, { provide: Router, useValue: { navigate: jest.fn() } }]
    });
  });

  it('should ...', () => {
    const guard = TestBed.inject(AuthGuard);
    expect(guard).toBeTruthy();
  });
});
