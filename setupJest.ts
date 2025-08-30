import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

// Fix for esbuild Buffer issue
Object.defineProperty(globalThis, 'Buffer', {
  value: Buffer,
  writable: false,
  enumerable: false,
  configurable: false,
});

// Add custom Jest matchers
expect.extend({
  toBeTrue(received) {
    const pass = received === true;
    return {
      message: () => `expected ${received} to be true`,
      pass,
    };
  },
  toBeFalse(received) {
    const pass = received === false;
    return {
      message: () => `expected ${received} to be false`,
      pass,
    };
  },
});

import './jestGlobalMocks'; // browser mocks globally available for every test
