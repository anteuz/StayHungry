import { TestBed } from '@angular/core/testing';

import { NetworkServiceService } from './network-service.service';

describe('NetworkServiceService', () => {
  beforeEach(() => {
    // Initialize Angular testing environment
    try {
      const testing = require('@angular/core/testing');
      const platform = require('@angular/platform-browser-dynamic/testing');
      if (!(testing as any).getTestBed().ngModule)
        (testing as any).TestBed.initTestEnvironment(platform.BrowserDynamicTestingModule, platform.platformBrowserDynamicTesting());
    } catch {}

    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    const service: NetworkServiceService = TestBed.inject(NetworkServiceService);
    expect(service).toBeTruthy();
  });
});
