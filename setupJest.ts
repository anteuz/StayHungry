import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

// Setup Zone.js testing environment
setupZoneTestEnv();

require('./jestGlobalMocks');

// Make Jest testing utilities available globally
(global as any).spyOn = require('jest-mock').spyOn;
(global as any).jest = require('jest-mock');

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

// Mock Firebase Auth functions globally
(global as any).mockFirebaseAuth = {
  signInWithPopup: jest.fn(),
  signInWithRedirect: jest.fn(),
  getRedirectResult: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  GoogleAuthProvider: jest.fn().mockImplementation(() => ({
    addScope: jest.fn()
  }))
};