import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { Auth, User } from '@angular/fire/auth';
import { Database } from '@angular/fire/database';
import { Storage } from '@angular/fire/storage';

/**
 * Common test setup utilities for consistent testing across the application
 */

export function createMockAuth(currentUser: User | null = null) {
  return {
    currentUser,
    authStateReady: () => Promise.resolve(),
    onAuthStateChanged: jest.fn()
  };
}

export function createMockRouter() {
  return {
    navigate: jest.fn().mockResolvedValue(true),
    navigateByUrl: jest.fn().mockResolvedValue(true)
  };
}

export function createMockUser(uid: string = 'test-user-123') {
  return {
    uid,
    email: 'test@example.com',
    getIdToken: jest.fn().mockResolvedValue('mock-token'),
    emailVerified: true,
    isAnonymous: false
  };
}

export function createMockDatabase() {
  return {
    ref: jest.fn(),
    push: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    remove: jest.fn()
  };
}

export function createMockStorage() {
  return {
    ref: jest.fn(),
    uploadBytes: jest.fn(),
    getDownloadURL: jest.fn(),
    deleteObject: jest.fn()
  };
}

/**
 * Common TestBed configuration for Firebase-enabled components
 */
export function getFirebaseTestingModule() {
  return {
    imports: [HttpClientTestingModule, IonicModule.forRoot()],
    providers: [
      { provide: Auth, useValue: createMockAuth() },
      { provide: Database, useValue: createMockDatabase() },
      { provide: Storage, useValue: createMockStorage() },
      { provide: Router, useValue: createMockRouter() }
    ]
  };
}

/**
 * Security test utilities
 */
export const SecurityTestData = {
  validEmails: [
    'test@example.com',
    'user.name@example.com',
    'user+tag@example.co.uk'
  ],
  invalidEmails: [
    'invalid-email',
    '@example.com',
    'test@',
    'test..test@example.com',
    '',
    'a'.repeat(255) + '@example.com'
  ],
  validPasswords: [
    'Password123',
    'SecurePass1',
    'MyStr0ngP@ss'
  ],
  invalidPasswords: [
    'short',
    '12345678',
    'password',
    'PASSWORD',
    '',
    'a'.repeat(129)
  ],
  maliciousInputs: [
    '<script>alert("xss")</script>',
    'javascript:alert("xss")',
    '${alert("xss")}',
    'onclick="alert(\'xss\')"',
    "admin'--",
    "'; DROP TABLE users; --"
  ]
};

/**
 * File testing utilities
 */
export function createTestFile(name: string, type: string, size: number = 1024): File {
  const content = new ArrayBuffer(size);
  return new File([content], name, { type });
}

export const TestFiles = {
  validImage: () => createTestFile('test.jpg', 'image/jpeg'),
  largeImage: () => createTestFile('large.jpg', 'image/jpeg', 15 * 1024 * 1024),
  maliciousFile: () => createTestFile('malicious.exe', 'application/octet-stream'),
  scriptFile: () => createTestFile('script.js', 'application/javascript')
};