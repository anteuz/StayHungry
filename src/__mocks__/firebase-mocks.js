// Mock Firebase modules for testing
const mockUser = {
  uid: 'mock-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  getIdToken: jest.fn().mockResolvedValue('mock-token'),
  providerData: [{ providerId: 'google.com' }]
};

const mockUserCredential = {
  user: mockUser,
  credential: null,
  operationType: 'signIn'
};

// Auth module mocks
const Auth = jest.fn().mockImplementation(() => ({
  currentUser: null,
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  signInWithRedirect: jest.fn(),
  getRedirectResult: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn()
}));

const createUserWithEmailAndPassword = jest.fn().mockResolvedValue(mockUserCredential);
const signInWithEmailAndPassword = jest.fn().mockResolvedValue(mockUserCredential);
const signInWithPopup = jest.fn().mockResolvedValue(mockUserCredential);
const signInWithRedirect = jest.fn().mockResolvedValue(undefined);
const getRedirectResult = jest.fn().mockResolvedValue(null);
const signOut = jest.fn().mockResolvedValue(undefined);
const onAuthStateChanged = jest.fn();

// Google Auth Provider mock
const GoogleAuthProvider = jest.fn().mockImplementation(() => ({
  addScope: jest.fn(),
  setCustomParameters: jest.fn()
}));

// User mock
const User = jest.fn().mockImplementation(() => mockUser);

// Database module mocks
const Database = jest.fn().mockImplementation(() => ({
  ref: jest.fn(),
  set: jest.fn(),
  get: jest.fn(),
  push: jest.fn(),
  remove: jest.fn(),
  update: jest.fn()
}));

const ref = jest.fn().mockReturnValue({
  set: jest.fn().mockResolvedValue(undefined),
  get: jest.fn().mockResolvedValue({ val: () => null }),
  push: jest.fn().mockResolvedValue({ key: 'mock-key' }),
  remove: jest.fn().mockResolvedValue(undefined),
  update: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
  off: jest.fn()
});

const onValue = jest.fn();
const set = jest.fn().mockResolvedValue(undefined);
const get = jest.fn().mockResolvedValue({ val: () => null });
const push = jest.fn().mockResolvedValue({ key: 'mock-key' });
const remove = jest.fn().mockResolvedValue(undefined);
const update = jest.fn().mockResolvedValue(undefined);
const object = jest.fn();

// Storage module mocks
const Storage = jest.fn().mockImplementation(() => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn()
}));

const uploadBytes = jest.fn().mockResolvedValue({ ref: { fullPath: 'mock-path' } });
const getDownloadURL = jest.fn().mockResolvedValue('https://example.com/mock-url');
const deleteObject = jest.fn().mockResolvedValue(undefined);

module.exports = {
  // Auth exports
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  User,
  
  // Database exports
  Database,
  ref,
  onValue,
  set,
  get,
  push,
  remove,
  update,
  object,
  
  // Storage exports
  Storage,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  
  // Mock data
  mockUser,
  mockUserCredential
};