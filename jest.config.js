module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setupJest.ts'],
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/src/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$'
      }
    ]
  },
  testMatch: [
    '<rootDir>/src/**/*.spec.ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/main.ts',
    '!src/polyfills.ts'
  ],
  moduleNameMapper: {
    '@src/(.*)': '<rootDir>/src/$1',
    '@app/(.*)': '<rootDir>/src/app/$1',
    '@ionic-native/splash-screen/ngx': '<rootDir>/src/__mocks__/ionic-native-mocks.js',
    '@ionic-native/status-bar/ngx': '<rootDir>/src/__mocks__/ionic-native-mocks.js',
    '@angular/fire/auth': '<rootDir>/src/__mocks__/firebase-mocks.js',
    '@angular/fire/database': '<rootDir>/src/__mocks__/firebase-mocks.js',
    '@angular/fire/storage': '<rootDir>/src/__mocks__/firebase-mocks.js',
    './user-storage.service': '<rootDir>/src/__mocks__/user-storage-mocks.js',
    '^./user-storage.service$': '<rootDir>/src/__mocks__/user-storage-mocks.js',
    '^.*/user-storage.service$': '<rootDir>/src/__mocks__/user-storage-mocks.js'
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/e2e/',
    '<rootDir>/src/test.ts'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!@angular|@ionic|@ionic-native|@stencil|ionicons|lit)'
  ],
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'js', 'html', 'json']
};
