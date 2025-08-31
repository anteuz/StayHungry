import { TestBed } from '@angular/core/testing';
import { Auth, User, UserCredential } from '@angular/fire/auth';
import { AuthService } from './auth.service';
import { UserStorageService } from './user-storage.service';

// Mock Firebase Auth functions - declare before using
const mockSignInWithPopup = jest.fn();
const mockSignInWithRedirect = jest.fn();
const mockGetRedirectResult = jest.fn();
const mockSignOut = jest.fn();
const mockOnAuthStateChanged = jest.fn();
const mockGoogleAuthProvider = jest.fn().mockImplementation(() => ({
  addScope: jest.fn()
}));

// Mock Firebase Auth
const mockAuth = {
  currentUser: null,
  signInWithPopup: mockSignInWithPopup,
  signInWithRedirect: mockSignInWithRedirect,
  getRedirectResult: mockGetRedirectResult,
  signOut: mockSignOut
};

// Mock UserStorageService
const mockUserStorageService = {
  storeFromUser: jest.fn().mockResolvedValue(undefined),
  clearUserData: jest.fn().mockResolvedValue(undefined)
};

describe('AuthService', () => {
  let service: AuthService;
  let auth: Auth;
  let userStorageService: UserStorageService;

  const mockUser: Partial<User> = {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg',
    getIdToken: jest.fn().mockResolvedValue('mock-token')
  };

  const mockUserCredential: Partial<UserCredential> = {
    user: mockUser as User
  };

  beforeEach(() => {
    // Mock onAuthStateChanged to immediately call the callback with null user
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null);
      return () => {}; // Return unsubscribe function
    });

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Auth, useValue: mockAuth },
        { provide: UserStorageService, useValue: mockUserStorageService }
      ]
    });

    service = TestBed.inject(AuthService);
    auth = TestBed.inject(Auth);
    userStorageService = TestBed.inject(UserStorageService);

    // Reset mocks
    jest.clearAllMocks();
    mockAuth.currentUser = null;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Google Sign-In Popup', () => {
    it('should sign in with Google popup successfully', async () => {
      mockSignInWithPopup.mockResolvedValue(mockUserCredential);

      const result = await service.signInWithGooglePopup();

      expect(mockSignInWithPopup).toHaveBeenCalledWith(mockAuth, expect.any(Object));
      expect(result).toEqual(mockUserCredential);
    });

    it('should handle Google popup sign-in errors', async () => {
      const mockError = { code: 'auth/popup-blocked', message: 'Popup blocked' };
      mockSignInWithPopup.mockRejectedValue(mockError);

      await expect(service.signInWithGooglePopup()).rejects.toThrow('Pop-up was blocked by your browser. Please allow pop-ups and try again.');
    });

    it('should handle popup closed by user error', async () => {
      const mockError = { code: 'auth/popup-closed-by-user', message: 'Popup closed' };
      mockSignInWithPopup.mockRejectedValue(mockError);

      await expect(service.signInWithGooglePopup()).rejects.toThrow('Sign-in was cancelled. Please try again.');
    });
  });

  describe('Google Sign-In Redirect', () => {
    it('should sign in with Google redirect successfully', async () => {
      mockSignInWithRedirect.mockResolvedValue(undefined);

      await service.signInWithGoogleRedirect();

      expect(mockSignInWithRedirect).toHaveBeenCalledWith(mockAuth, expect.any(Object));
    });

    it('should get redirect result successfully', async () => {
      mockGetRedirectResult.mockResolvedValue(mockUserCredential);

      const result = await service.getRedirectResult();

      expect(mockGetRedirectResult).toHaveBeenCalledWith(mockAuth);
      expect(result).toEqual(mockUserCredential);
    });
  });

  describe('Sign Out', () => {
    it('should sign out successfully', async () => {
      mockSignOut.mockResolvedValue(undefined);

      await service.signOut();

      expect(mockSignOut).toHaveBeenCalledWith(mockAuth);
    });

    it('should handle sign out errors', async () => {
      const mockError = new Error('Sign out failed');
      mockSignOut.mockRejectedValue(mockError);

      await expect(service.signOut()).rejects.toThrow('Authentication failed. Please try again.');
    });
  });

  describe('User Information', () => {
    beforeEach(() => {
      mockAuth.currentUser = mockUser as User;
    });

    it('should get current user', () => {
      const user = service.getCurrentUser();
      expect(user).toEqual(mockUser);
    });

    it('should get current user UID', () => {
      const uid = service.getCurrentUserUID();
      expect(uid).toBe('test-uid');
    });

    it('should get current user email', () => {
      const email = service.getCurrentUserEmail();
      expect(email).toBe('test@example.com');
    });

    it('should get current user display name', () => {
      const displayName = service.getCurrentUserDisplayName();
      expect(displayName).toBe('Test User');
    });

    it('should get current user photo URL', () => {
      const photoURL = service.getCurrentUserPhotoURL();
      expect(photoURL).toBe('https://example.com/photo.jpg');
    });

    it('should get current user token', async () => {
      const token = await service.getCurrentUserToken();
      expect(token).toBe('mock-token');
      expect(mockUser.getIdToken).toHaveBeenCalled();
    });

    it('should return null values when no user is authenticated', () => {
      mockAuth.currentUser = null;

      expect(service.getCurrentUser()).toBeNull();
      expect(service.getCurrentUserUID()).toBeNull();
      expect(service.getCurrentUserEmail()).toBeNull();
      expect(service.getCurrentUserDisplayName()).toBeNull();
      expect(service.getCurrentUserPhotoURL()).toBeNull();
    });

    it('should return null token when no user is authenticated', async () => {
      mockAuth.currentUser = null;
      const token = await service.getCurrentUserToken();
      expect(token).toBeNull();
    });
  });

  describe('Authentication State', () => {
    it('should return correct authentication status', () => {
      // Set up authenticated state
      service['authState'].next({
        user: mockUser as User,
        isAuthenticated: true,
        isLoading: false
      });

      expect(service.isAuthenticated()).toBe(true);
      expect(service.isLoading()).toBe(false);
    });

    it('should return correct loading status', () => {
      // Set up loading state
      service['authState'].next({
        user: null,
        isAuthenticated: false,
        isLoading: true
      });

      expect(service.isAuthenticated()).toBe(false);
      expect(service.isLoading()).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const mockError = { code: 'auth/network-request-failed', message: 'Network failed' };
      mockSignInWithPopup.mockRejectedValue(mockError);

      await expect(service.signInWithGooglePopup()).rejects.toThrow('Network error. Please check your connection and try again.');
    });

    it('should handle too many requests error', async () => {
      const mockError = { code: 'auth/too-many-requests', message: 'Too many requests' };
      mockSignInWithPopup.mockRejectedValue(mockError);

      await expect(service.signInWithGooglePopup()).rejects.toThrow('Too many requests. Please wait a moment and try again.');
    });

    it('should handle user disabled error', async () => {
      const mockError = { code: 'auth/user-disabled', message: 'User disabled' };
      mockSignInWithPopup.mockRejectedValue(mockError);

      await expect(service.signInWithGooglePopup()).rejects.toThrow('This account has been disabled. Please contact support.');
    });

    it('should handle unknown errors with generic message', async () => {
      const mockError = { code: 'auth/unknown-error', message: 'Unknown error' };
      mockSignInWithPopup.mockRejectedValue(mockError);

      await expect(service.signInWithGooglePopup()).rejects.toThrow('Authentication failed. Please try again.');
    });
  });
});