import 'jest-preset-angular/setup-env/zone';
import { getTestBed, TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
require('./jestGlobalMocks');

// Make Jest testing utilities available globally
(global as any).spyOn = require('jest-mock').spyOn;
(global as any).jest = require('jest-mock');

// Jasmine compatibility shims for legacy tests
(global as any).jasmine = (global as any).jasmine || {}
;(global as any).jasmine.createSpyObj = (baseName: string, methodNames: string[] = [], properties: Record<string, any> = {}) => {
  const obj: Record<string, any> = { ...properties }
  for (const name of methodNames) {
    obj[name] = (global as any).jest.fn()
  }
  return obj
}
;(global as any).spyOnProperty = (obj: any, propertyName: string, accessType: 'get' | 'set' = 'get') => {
  return (global as any).jest.spyOn(obj, propertyName, accessType as any)
}

// Jest matcher aliases for Jasmine-style expectations
expect.extend({
  toBeTrue(received: any) {
    const pass = received === true
    return { pass, message: () => `expected ${received} to be true` }
  },
  toBeFalse(received: any) {
    const pass = received === false
    return { pass, message: () => `expected ${received} to be false` }
  },
  toThrowError(received: any, expected?: any) {
    try {
      received()
      return { pass: false, message: () => 'expected function to throw, but it did not' }
    } catch (error: any) {
      if (expected instanceof RegExp) {
        const pass = expected.test(String(error?.message ?? error))
        return { pass, message: () => `expected error message to match ${expected}, got ${error?.message}` }
      }
      return { pass: true, message: () => 'function threw an error as expected' }
    }
  },
  async toBeRejectedWith(received: Promise<any>, expected: any) {
    try {
      await received
      return { pass: false, message: () => 'expected promise to be rejected, but it resolved' }
    } catch (error) {
      if (expected && typeof expected === 'object') {
        const keys = Object.keys(expected)
        const pass = keys.every(k => (error as any)?.[k] === (expected as any)[k])
        return { pass, message: () => `expected rejection to match ${JSON.stringify(expected)}, got ${JSON.stringify(error)}` }
      }
      return { pass: true, message: () => 'promise rejected as expected' }
    }
  }
} as any)

// Shim TestBed.get for legacy tests
try {
  if (!(getTestBed() as any).ngModule) {
    TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting())
  }
  if ((TestBed as any) && !(TestBed as any).get) {
    ;(TestBed as any).get = TestBed.inject.bind(TestBed)
  }
} catch {}

// Mock Angular testing utilities
global.Buffer = global.Buffer || require('buffer').Buffer;

// Mock ReadableStream for Firebase
(global as any).ReadableStream = (global as any).ReadableStream || class ReadableStream {
  constructor() {}
};

// Mock WritableStream for Firebase
(global as any).WritableStream = (global as any).WritableStream || class WritableStream {
  constructor() {}
};

// Mock TransformStream for Firebase
(global as any).TransformStream = (global as any).TransformStream || class TransformStream {
  constructor() {}
};

// Mock window object for tests
Object.defineProperty(window, 'CSS', { value: null });
Object.defineProperty(document, 'doctype', {
  value: '<!DOCTYPE html>'
});
Object.defineProperty(window, 'getComputedStyle', {
  value: () => {
    return {
      display: 'none',
      appearance: ['-webkit-appearance']
    };
  }
});

// Only define transform if it doesn't already exist
if (!document.body.style.transform) {
  Object.defineProperty(document.body.style, 'transform', {
    value: () => {
      return {
        enumerable: true,
        configurable: true,
      };
    },
  });
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
(global as any).ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
(global as any).IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
